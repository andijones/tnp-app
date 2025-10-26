# Environment Setup

This guide explains how to set up your development environment for The Naked Pantry.

## Environment Variables

The app uses environment variables to store sensitive configuration like API keys. These are stored in a `.env` file that is **not committed to git** for security.

### Initial Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Supabase credentials:**

   Open `.env` and replace the placeholder values with your actual Supabase credentials:

   ```
   EXPO_PUBLIC_SUPABASE_URL=your-actual-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

3. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard: https://supabase.com/dashboard
   - Navigate to **Settings** → **API**
   - Copy the **Project URL** (for `EXPO_PUBLIC_SUPABASE_URL`)
   - Copy the **anon/public key** (for `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

### Important Notes

- ✅ **`.env`** is in `.gitignore` - your secrets are safe
- ✅ **`.env.example`** is committed - helps other developers set up
- ⚠️ **Never commit your `.env` file** to version control
- ⚠️ **Never share your Supabase keys** publicly

### Expo Environment Variables

We use Expo's `EXPO_PUBLIC_` prefix for environment variables to make them available in the app:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

These are accessed in the code via:
```typescript
process.env.EXPO_PUBLIC_SUPABASE_URL
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Troubleshooting

**App crashes with "Missing Supabase configuration" error:**
- Make sure you've created the `.env` file
- Check that your `.env` file has the correct variable names (with `EXPO_PUBLIC_` prefix)
- Restart the Expo development server after creating/modifying `.env`

**Changes to `.env` not reflecting:**
- Restart your development server (`npm start` or `npx expo start`)
- Clear Expo cache: `npx expo start --clear`

### Production Deployment

For production builds, you'll need to set environment variables through your build service:

**EAS Build (Expo):**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-key
```

**Alternatively**, add them to `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your-url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-key"
      }
    }
  }
}
```

## Next Steps

After setting up your environment variables:

1. Install dependencies: `npm install`
2. Start the development server: `npx expo start`
3. Choose your platform (iOS, Android, or Web)

For more information, see the main [README.md](./README.md).
