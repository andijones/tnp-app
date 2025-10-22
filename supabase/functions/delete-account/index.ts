// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Starting account deletion for user: ${user.id}`)

    // Create admin client to perform deletions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Delete user's ratings/reviews
    const { error: ratingsError } = await supabaseAdmin
      .from('ratings')
      .delete()
      .eq('user_id', user.id)

    if (ratingsError) {
      console.error('Error deleting ratings:', ratingsError)
      throw new Error('Failed to delete user reviews')
    }
    console.log('Deleted user ratings')

    // Step 2: Delete user's favorites
    const { error: favoritesError } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', user.id)

    if (favoritesError) {
      console.error('Error deleting favorites:', favoritesError)
      throw new Error('Failed to delete user favorites')
    }
    console.log('Deleted user favorites')

    // Step 3: Update or delete user's food contributions
    // Option A: Delete contributions (if you want to remove them completely)
    const { error: foodsError } = await supabaseAdmin
      .from('foods')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending') // Only delete pending submissions

    if (foodsError) {
      console.error('Error deleting pending foods:', foodsError)
      // Continue even if this fails - might not have any pending foods
    }
    console.log('Deleted pending food submissions')

    // Option B: Keep approved contributions but anonymize them
    const { error: updateFoodsError } = await supabaseAdmin
      .from('foods')
      .update({ user_id: '00000000-0000-0000-0000-000000000000' }) // Anonymous UUID
      .eq('user_id', user.id)
      .eq('status', 'approved')

    if (updateFoodsError) {
      console.error('Error anonymizing approved foods:', updateFoodsError)
      // Continue even if this fails
    }
    console.log('Anonymized approved food contributions')

    // Step 4: Delete user's profile data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error('Failed to delete user profile')
    }
    console.log('Deleted user profile')

    // Step 5: Delete user's avatar from storage (if exists)
    try {
      const { data: files } = await supabaseAdmin
        .storage
        .from('avatars')
        .list('', {
          search: user.id,
        })

      if (files && files.length > 0) {
        const filePaths = files.map((file) => file.name)
        await supabaseAdmin
          .storage
          .from('avatars')
          .remove(filePaths)
        console.log('Deleted user avatar images')
      }
    } catch (storageError) {
      console.error('Error deleting avatar:', storageError)
      // Continue even if avatar deletion fails
    }

    // Step 6: Delete the auth user (this must be last)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    )

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      throw new Error('Failed to delete user account')
    }
    console.log('Deleted auth user')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account successfully deleted',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Account deletion error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to delete account',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
