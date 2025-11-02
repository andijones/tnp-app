# Ingredient Extractor Edge Function

This Supabase Edge Function extracts text from food package images using **OpenAI GPT-4o-mini Vision API**. It's used by the AI Ingredient Scanner feature in The Naked Pantry app.

## 🔑 API Used

- **OpenAI GPT-4o-mini Vision API**
- Model: `gpt-4o-mini`
- Pricing: ~$0.15 per 1M input tokens
- Rate limit: 5 extractions per minute per user (server-side enforced)

## ✅ Setup Instructions

### Prerequisites

✅ You already have `OPENAI_API_KEY` configured in Supabase!

### 1. Verify API Key in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** > **Edge Functions** > **Secrets**
4. Verify `OPENAI_API_KEY` is set

### 2. Deploy the Function

From the project root directory, run:

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link your project (if not already linked)
supabase link --project-ref uacihrlnwlqhpbobzajs

# Deploy the function
supabase functions deploy ingredient-extractor
```

### 3. Verify Deployment

Test the function using curl:

```bash
curl -i --location --request POST \
  'https://uacihrlnwlqhpbobzajs.supabase.co/functions/v1/ingredient-extractor' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "imageData": "data:image/jpeg;base64,YOUR_BASE64_IMAGE_DATA"
  }'
```

## 📋 Request Format

The function expects a POST request with the following body:

```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
}
```

**Supported formats:**
- Data URL format: `data:image/jpeg;base64,...`
- Raw base64 string (will be wrapped automatically)

**Supported image types:**
- JPEG
- PNG
- WebP

**Size limits:**
- Max 10MB base64 data (~13,981,014 characters)

## 📤 Response Format

### Success Response (200)

```json
{
  "success": true,
  "extractedText": "water, organic tomatoes, organic onions, sea salt, organic garlic, organic basil, natural flavoring"
}
```

### Error Responses

**400 Bad Request** - Missing or invalid imageData
```json
{
  "success": false,
  "error": "Missing imageData parameter"
}
```

**400 Bad Request** - Image too large
```json
{
  "success": false,
  "error": "Image too large (max 10MB)"
}
```

**400 Bad Request** - Invalid format
```json
{
  "success": false,
  "error": "Invalid image format. Supported: JPEG, PNG, WebP"
}
```

**401 Unauthorized** - Authentication failed
```json
{
  "success": false,
  "error": "Invalid authentication"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please wait before trying again."
}
```

**500 Internal Server Error** - API not configured
```json
{
  "success": false,
  "error": "OCR service not configured"
}
```

**500 Internal Server Error** - OCR failed
```json
{
  "success": false,
  "error": "Failed to extract ingredients from image"
}
```

## 🔒 Security Features

### 1. Authentication Required

```typescript
// Edge function checks auth header
const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ success: false, error: 'Invalid authentication' }),
    { status: 401 }
  );
}
```

### 2. Rate Limiting (Server-Side)

- **5 calls per minute per user**
- Tracked in `user_submissions` table
- Prevents API abuse

```typescript
const { data: recentCalls } = await supabaseClient
  .from('user_submissions')
  .select('created_at')
  .eq('user_id', user.id)
  .eq('action', 'ingredient_extraction')
  .gte('created_at', new Date(Date.now() - 60000).toISOString());

if (recentCalls && recentCalls.length >= 5) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please wait before trying again.'
    }),
    { status: 429 }
  );
}
```

### 3. Input Validation

- Max 10MB image size
- Validates image format (JPEG, PNG, WebP)
- Sanitizes base64 input

### 4. Usage Tracking

- Logs every extraction to `user_submissions` table
- Tracks: `user_id`, `action: 'ingredient_extraction'`, `created_at`

## 💰 Cost Information

OpenAI GPT-4o-mini Vision API pricing:
- **~$0.15 per 1M input tokens**
- Average ingredient photo: ~1000-2000 tokens
- **Estimated cost**: $0.0002-0.0003 per scan

For a small to medium app:
- 1,000 scans/month: **~$0.20-0.30**
- 10,000 scans/month: **~$2-3**

Much more cost-effective than Google Cloud Vision!

## 🧪 Troubleshooting

### "OCR service not configured" error

- Ensure `OPENAI_API_KEY` is set in Supabase Edge Function secrets
- Verify the API key is valid in your OpenAI account

### "OCR extraction failed" error

- Check that the image is properly base64 encoded
- Verify the image size is under 10MB
- Check OpenAI API status: https://status.openai.com/

### "Invalid authentication" error

- Ensure the user is logged in
- Check that the Authorization header includes a valid Supabase auth token

### "Rate limit exceeded" error

- User has made 5+ requests in the last minute
- Wait 1 minute before trying again
- This is a server-side limit to prevent abuse

### "No ingredients text found in the image" error

- Image may not contain clear ingredients text
- Try retaking the photo with better lighting
- Ensure the ingredients list is in focus

## 📊 Monitoring

View function logs:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Select **ingredient-extractor**
4. View logs and invocations

## 🔧 Local Testing

Test the function locally:

```bash
# Start local Supabase
supabase start

# Serve the function
supabase functions serve ingredient-extractor

# Test with curl (replace with your local anon key)
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/ingredient-extractor' \
  --header 'Authorization: Bearer YOUR_LOCAL_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data @test-request.json
```

Example `test-request.json`:
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

## 🔗 Related Documentation

- [OpenAI Vision API Docs](https://platform.openai.com/docs/guides/vision)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [React Native Implementation Guide](../../../CLAUDE.md)

## 🎯 How It Works

1. **User captures photo** in IngredientScannerScreen
2. **Image optimized** to max 2048px width, 80% quality
3. **Converted to base64** data URL format
4. **Sent to edge function** with auth token
5. **Rate limit checked** (5 per minute)
6. **OpenAI Vision API called** with specific prompt
7. **Text extracted** and cleaned
8. **Usage logged** to database
9. **Response returned** to app
10. **NOVA classification** performed on-device

## ✨ AI Prompt

The function uses a carefully crafted prompt for optimal results:

```
Extract the ingredients list from this food package photo.

IMPORTANT RULES:
1. Return ONLY the ingredients as a comma-separated list
2. Do NOT include any explanations, notes, or additional text
3. If you see "Ingredients:" label, ignore it and just return the ingredient names
4. Preserve original language (but prioritize English if multiple languages are present)
5. Clean up OCR artifacts (fix obvious spelling errors, remove broken characters)
6. If no ingredients are visible, return "NO_INGREDIENTS_FOUND"

Example good output: "water, organic tomatoes, sea salt, organic basil, natural flavoring"
Example bad output: "Here are the ingredients I found: water, tomatoes..." (DO NOT DO THIS)
```

This prompt ensures:
- Clean, parseable output
- No extra commentary
- Automatic OCR cleanup
- Multilingual support
- Clear failure case handling

## 🚀 Performance

- **Average response time**: 2-4 seconds
- **Timeout**: 60 seconds (Supabase default)
- **Max image size**: 10MB (recommended under 5MB)

For optimal performance:
- Compress images before sending (already done in app)
- Use JPEG format (smaller than PNG)
- Crop to show only ingredients list
- Ensure good lighting for clearer text

## 🔄 Migration from Google Cloud Vision

This function previously used Google Cloud Vision API. We migrated to OpenAI GPT-4o-mini Vision for:
- ✅ Better accuracy with difficult-to-read text
- ✅ More cost-effective pricing
- ✅ Simpler authentication (API key vs service account)
- ✅ Better handling of multilingual text
- ✅ Automatic OCR cleanup and error correction

No changes needed in the React Native app - the API interface remains the same!
