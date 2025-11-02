// Supabase Edge Function: ingredient-extractor
// Extracts text from images using OpenAI GPT-4o-mini Vision API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  imageData: string; // Base64 or data URL
}

interface OCRResponse {
  success: boolean;
  extractedText?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Authenticated user:', user.id);

    // Rate limiting: Check recent submissions (5 per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentCalls, error: rateLimitError } = await supabaseClient
      .from('user_submissions')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('action', 'ingredient_extraction')
      .gte('created_at', oneMinuteAgo);

    if (!rateLimitError && recentCalls && recentCalls.length >= 5) {
      console.log('⚠️ Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please wait before trying again.'
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    let imageData = body.imageData;

    if (!imageData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing imageData parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Input validation: Check size (max ~10MB base64)
    if (imageData.length > 13981014) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image too large (max 10MB)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate format and extract base64
    let base64Image: string;
    if (imageData.startsWith('data:image/')) {
      // Data URL format: data:image/jpeg;base64,/9j/4AAQ...
      const matches = imageData.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
      if (!matches) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid image format. Supported: JPEG, PNG, WebP' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      base64Image = matches[2];
    } else {
      // Assume raw base64
      base64Image = imageData;
    }

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'OCR service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📸 Calling OpenAI Vision API...');

    // Call OpenAI GPT-4o-mini Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the ingredients list from this food package photo.

IMPORTANT RULES:
1. Return ONLY the ingredients as a comma-separated list
2. Do NOT include any explanations, notes, or additional text
3. If you see "Ingredients:" label, ignore it and just return the ingredient names
4. Preserve original language (but prioritize English if multiple languages are present)
5. Clean up OCR artifacts (fix obvious spelling errors, remove broken characters)
6. If no ingredients are visible, return "NO_INGREDIENTS_FOUND"

Example good output: "water, organic tomatoes, sea salt, organic basil, natural flavoring"
Example bad output: "Here are the ingredients I found: water, tomatoes..." (DO NOT DO THIS)`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to extract ingredients from image',
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const aiResponse = await response.json();
    const extractedText = aiResponse.choices?.[0]?.message?.content?.trim() || '';

    console.log('✅ Extracted text length:', extractedText.length);

    if (!extractedText || extractedText === 'NO_INGREDIENTS_FOUND') {
      console.log('⚠️ No ingredients found in image');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No ingredients text found in the image. Please ensure the ingredients list is clearly visible.'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log usage to database
    await supabaseClient.from('user_submissions').insert({
      user_id: user.id,
      action: 'ingredient_extraction',
      created_at: new Date().toISOString(),
    });

    // Return success response
    const successResponse: OCRResponse = {
      success: true,
      extractedText,
    };

    console.log('✅ Successfully extracted ingredients');

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in ingredient-extractor:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
