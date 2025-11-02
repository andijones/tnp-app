# Supabase Edge Functions

This directory contains Supabase Edge Functions for The Naked Pantry app.

## Available Functions

### ingredient-extractor

Extracts text from ingredient list images using Google Cloud Vision API for the OCR scanner feature.

**Requirements**:
- Google Cloud Vision API key
- Configure `GOOGLE_CLOUD_VISION_API_KEY` in Supabase Edge Function secrets

**See**: `ingredient-extractor/README.md` for full setup instructions

### delete-account

Handles secure account deletion with the following steps:
1. Deletes user ratings/reviews
2. Deletes user favorites
3. Deletes pending food submissions
4. Anonymizes approved food contributions (preserves community data)
5. Deletes user profile data
6. Deletes user avatar images from storage
7. Deletes the authentication user

**Security**: This function requires authentication and can only delete the authenticated user's own account.

## Deployment

### Prerequisites

1. Install the Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project (get your project ref from Supabase dashboard):
```bash
supabase link --project-ref your-project-ref
```

### Deploy All Functions

```bash
supabase functions deploy
```

### Deploy a Specific Function

```bash
supabase functions deploy delete-account
```

### Set Environment Variables

The functions require the following environment variables (automatically set by Supabase):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

### Test Locally

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve delete-account

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/delete-account' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  --header 'Content-Type: application/json'
```

## Security Considerations

- The `delete-account` function uses the service role key to perform admin operations
- Only the authenticated user can delete their own account
- Approved contributions are anonymized (not deleted) to preserve community data
- All user-specific data (ratings, favorites, profile) is permanently deleted

## Testing

Before deploying to production, test the function with a test account:

1. Create a test user account
2. Add some test data (favorites, reviews, food submissions)
3. Call the delete-account function
4. Verify all data is properly deleted/anonymized
5. Confirm the user cannot log in anymore

## Monitoring

View function logs in the Supabase dashboard:
1. Go to your project dashboard
2. Navigate to Edge Functions
3. Select the function to view logs and invocations
