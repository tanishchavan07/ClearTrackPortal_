# How to Get Supabase Credentials

## Finding Your Credentials in Supabase Dashboard

### 1. Go to Supabase Dashboard
- Visit: https://app.supabase.com
- Sign in with your account
- Select your project from the list

### 2. Locate Your Supabase URL

**Path:** Settings → API

1. Click **Settings** in the left sidebar
2. Select **API** from the options
3. Look for section labeled **Project URL**
4. Copy the URL starting with `https://` and ending with `.supabase.co`

**Example:**
```
https://my-project-123456.supabase.co
```

### 3. Locate Your Anon Key

**Same location:** Settings → API

In the same API settings page, find section **Project API keys**
- Look for **`anon` `public`** option
- This is your public key (safe to expose)
- Copy this value

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im...
```

### 4. Locate Your Service Role Key ⚠️ SECRET

**Same location:** Settings → API

In the **Project API keys** section:
- Look for **`service_role` `secret`** option  
- ⚠️ This is a PRIVATE key - treat like a password!
- Copy this value

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im...
```

**SECURITY NOTES:**
- ❌ Never commit this to git
- ❌ Never commit to public repositories
- ❌ Never share in emails, chat, or screenshots
- ✅ Only keep locally in `.env.local`
- ✅ On production, use hosting provider's secret management

## Setting Up .env.local

### Step 1: Create the File

1. Open VS Code
2. File → New File
3. Name: `.env.local`
4. Save in the root directory (next to `package.json`)

**Location:**
```
d:\Tanish\project_internship\.env.local
```

### Step 2: Add Your Credentials

Copy and paste into `.env.local`:

```
# Supabase Configuration
# Public - safe to expose
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# PRIVATE - never share or commit!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Replace with Your Values

Replace the placeholders:

1. **`your_url_here`** → Your Project URL from Settings → API
   - Example: `https://my-project.supabase.co`

2. **`your_anon_key_here`** → Your Anon Key from Settings → API
   - Example: `eyJhbGciOiJIUzI1Ni...`

3. **`your_service_role_key_here`** → Your Service Role Key from Settings → API
   - Example: `eyJhbGciOiJIUzI1Ni...`

### Final .env.local Example:

```
NEXT_PUBLIC_SUPABASE_URL=https://mycoolproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZ2hpamtsbW5vcHFyc3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MzI4MjAsImV4cCI6MTcxMTU3MDgyMH0.ABC123XYZ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZ2hpamtsbW5vcHFyc3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5NTkzMjgyMCwiZXhwIjoxNzcxNTcwODIwfQ.DEF456UVW
```

## Verify the Setup

### Check File Exists
```powershell
Test-Path .env.local
# Should output: True
```

### Check File Contents
```powershell
Get-Content .env.local
# Should show your three environment variables
```

### Check It's Ignored by Git
```powershell
git check-ignore .env.local
# Should output: .env.local
# This confirms it won't be accidentally committed
```

## If You Can't Find Your Credentials

### Option 1: Create a New Project
If you've lost your keys, you can create a new Supabase project:

1. Go to https://app.supabase.com
2. Click **New project**
3. Fill in project details
4. Wait for project to be created (2-3 minutes)
5. Then follow the steps above to get the new credentials

### Option 2: Regenerate Keys
If you have an existing project but lost the service role key:

1. Go to Settings → API
2. Under **Project API keys**, find **`service_role` `secret`**
3. Look for a "Reset" or regenerate button
4. Click to generate a new service role key
5. Note: This may invalidate the old key

## Production Setup

### For Vercel Deployment:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add three variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (public)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
   - `SUPABASE_SERVICE_ROLE_KEY` (secret/encrypted)
5. Redeploy project

### For Other Hosting:

Use your hosting provider's environment variable/secrets manager:
- **Railway**: Variables in deployment settings
- **Netlify**: Site settings → Build & deploy → Environment
- **Docker**: Use `.env` files or pass via `-e` flag
- **Traditional Server**: Set in system environment variables

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is not defined"

Check:
1. ✅ `.env.local` exists in project root
2. ✅ Variable name matches exactly (including case)
3. ✅ No typos in the key
4. ✅ Dev server restarted after adding file

### "API URL is not set"

Check:
1. ✅ `NEXT_PUBLIC_SUPABASE_URL` is set
2. ✅ URL starts with `https://`
3. ✅ URL ends with `.supabase.co`
4. ✅ No trailing slashes

### Keys work locally but not on production

Check:
1. ✅ Production environment variables are set in hosting provider
2. ✅ Variable names match exactly
3. ✅ Using different Supabase project? (If yes, use its keys instead)
4. ✅ Deployed after setting environment variables

## Security Checklist

Before going to production:

- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is NOT in any public files
- [ ] Service role key is NOT in version control history
- [ ] Using different projects for dev and production
- [ ] Using production Supabase project for production deployment
- [ ] Checked that no keys are exposed in error messages
- [ ] Understood the difference between Anon Key (public) and Service Role Key (private)

## Key Differences

| Key | Type | Where to Use | Security |
|-----|------|-------------|----------|
| **NEXT_PUBLIC_SUPABASE_URL** | Public | Browser & Server | ✅ Safe - just URL |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Public | Browser & Server | ✅ Limited permissions |
| **SUPABASE_SERVICE_ROLE_KEY** | Private | Server only | ⚠️ Full permissions - keep secret |

The service role key allows:
- Creating users without email verification
- Bypassing row-level security policies
- Full database access
- Everything an admin can do

That's why it must NEVER be exposed to the browser or committed to version control.
