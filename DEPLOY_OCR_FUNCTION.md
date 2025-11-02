# 🚀 Quick Guide: Deploy OCR Function

This guide will help you deploy the `ingredient-extractor` edge function to enable OCR scanning in The Naked Pantry app.

## ✅ What You Need

- **GOOGLE_SERVICE_ACCOUNT_KEY** - ✅ Already configured in Supabase!
- **Cloud Vision API** - Needs to be enabled (see below)
- **Supabase CLI** - Needs to be installed (see below)

---

## 📦 Step 1: Install Supabase CLI

Run this command in your terminal:

```bash
npm install -g supabase
```

Verify installation:

```bash
supabase --version
```

---

## 🔑 Step 2: Enable Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project associated with your `GOOGLE_SERVICE_ACCOUNT_KEY`
3. Go to **"APIs & Services"** > **"Library"**
4. Search for **"Cloud Vision API"**
5. Click **"Enable"**

**Verify Service Account Permissions:**
1. Go to **"IAM & Admin"** > **"IAM"**
2. Find your service account email
3. Ensure it has `Cloud Vision API User` role
   - If not, click "Edit" → "Add Another Role" → Select "Cloud Vision API User" → Save

---

## 🔗 Step 3: Link Your Supabase Project

Run these commands:

```bash
# Login to Supabase
supabase login

# Link your project (use your project ref: uacihrlnwlqhpbobzajs)
supabase link --project-ref uacihrlnwlqhpbobzajs
```

You'll be prompted to enter your database password. You can find it in:
- Supabase Dashboard > Project Settings > Database > Connection String

---

## 🚀 Step 4: Deploy the Function

From the project root directory (`/Users/andrewjones/Desktop/TNP`), run:

```bash
supabase functions deploy ingredient-extractor
```

You should see output like:
```
Deploying Function (project-ref = uacihrlnwlqhpbobzajs)
   ...
   ✅ Function deployed successfully
```

---

## 🧪 Step 5: Test the Function

Test if the function is working:

```bash
curl -i --location --request POST \
  'https://uacihrlnwlqhpbobzajs.supabase.co/functions/v1/ingredient-extractor' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhY2locmxud2xxaHBib2J6YWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTE2MjUsImV4cCI6MjA2MDEyNzYyNX0.NKoj5Olfg3sxPX0p3AT4POlxs4wmHa3XmcAIXEttxXU' \
  --header 'Content-Type: application/json' \
  --data '{"imageData": "test"}'
```

Expected response (will fail validation but shows function is running):
```json
{"error":"Invalid base64 format"}
```

This is good! It means the function is deployed and responding.

---

## 🎉 Step 6: Test in the App

1. Open The Naked Pantry app
2. Go to Scanner tab
3. Scan a product barcode (that doesn't have ingredients in the database)
4. You'll be redirected to the Ingredient Scanner
5. Take photos of the ingredients list and product front
6. The OCR should now extract text successfully! ✨

---

## 🐛 Troubleshooting

### "Function not found" error

**Solution**: Make sure you're in the project root directory when deploying:
```bash
cd /Users/andrewjones/Desktop/TNP
supabase functions deploy ingredient-extractor
```

### "Authentication failed" error

**Solutions**:
1. Check that Cloud Vision API is enabled
2. Verify service account has `Cloud Vision API User` role
3. Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is still set in Supabase:
   - Dashboard > Project Settings > Edge Functions > Secrets

### "Invalid base64 format" in the app

**Solution**: This is expected if testing with dummy data. Use real images in the app.

### "OCR extraction failed" in the app

**Solutions**:
1. Check Supabase Edge Function logs:
   - Dashboard > Edge Functions > ingredient-extractor > Logs
2. Verify the image is clear and well-lit
3. Ensure image size is under 5MB

---

## 📊 Monitor Function Usage

View function logs and invocations:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **ingredient-extractor**
4. View **Logs** and **Invocations**

---

## 💰 Cost Information

Google Cloud Vision API pricing:
- **First 1,000 requests/month**: **FREE** ✨
- 1,001 - 5,000,000 requests: $1.50 per 1,000

For a growing app, you'll likely stay in the free tier!

---

## ✅ Quick Command Reference

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref uacihrlnwlqhpbobzajs

# Deploy function
supabase functions deploy ingredient-extractor

# View function logs
supabase functions logs ingredient-extractor

# List all functions
supabase functions list
```

---

## 🎯 That's It!

After deploying, the OCR feature should work seamlessly in your app. Users will be able to:
1. ✅ Scan product barcodes
2. ✅ Take photos of ingredient lists
3. ✅ Automatically extract text using OCR
4. ✅ Get NOVA classification
5. ✅ Submit food items to the database

**Questions?** Check the detailed README at:
`supabase/functions/ingredient-extractor/README.md`

---

**Estimated Time**: 5-10 minutes ⏱️

**Difficulty**: Easy 🟢
