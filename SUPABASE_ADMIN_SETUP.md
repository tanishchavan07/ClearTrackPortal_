# Supabase Admin Setup Guide

## Prerequisites
1. **Get your Supabase Service Role Key:**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to Settings → API
   - Copy the Service Role (secret) key
   - ⚠️ NEVER commit this key to git or share publicly

2. **Get your Supabase URL:**
   - In the same Settings → API section
   - Copy the Project URL

## Setup Instructions

### 1. Add Environment Variables to `.env.local`

Create or update `.env.local` in the root of your project:

```
# Supabase - Public Keys (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase - Secret Keys (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Replace:**
- `your-project` with your Supabase project name
- `your_anon_key_here` with your actual anon key
- `your_service_role_key_here` with your actual service role key

### 2. IMPORTANT - Restart Development Server

After adding environment variables:

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

**The dev server must be restarted for environment variables to load!**

### 3. Verify Setup

You can verify the setup is correct by checking the API route logs when creating a team member. The admin client should be initialized without errors.

## Security Notes

✅ `NEXT_PUBLIC_SUPABASE_URL` - Safe to expose (used in browser)
✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Limited permissions (safe for browser)
❌ `SUPABASE_SERVICE_ROLE_KEY` - NEVER expose to browser (must stay server-side only)

## Troubleshooting

### Error: "supabase key is required"
1. ✅ Verify `.env.local` exists in project root (not in subdirectories)
2. ✅ Check that `SUPABASE_SERVICE_ROLE_KEY` is set with the full key
3. ✅ Restart dev server after changes
4. ✅ Verify key has no extra spaces or quotes

### Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"
1. ✅ Add the variable to `.env.local`
2. ✅ Use exact name: `SUPABASE_SERVICE_ROLE_KEY`
3. ✅ Restart dev server

### Can't create team members
1. ✅ Check browser console and server logs for errors
2. ✅ Verify you're logged in as an admin user
3. ✅ Verify all required fields (name, email, password) are provided

## Files Modified

- `/lib/supabase/server.ts` - Added `createAdminClient()` function
- `/app/api/members/route.ts` - Uses admin client for user creation

## How It Works

1. Admin clicks "Add Member" in the UI
2. Frontend sends POST request to `/api/members` with name, email, password
3. API route:
   - Verifies user is authenticated
   - Checks user is admin
   - Creates admin Supabase client using service_role key
   - Uses `admin.createUser()` to create user without sending email
   - Inserts user record into database
   - Returns success response
4. Frontend displays success message

## Admin vs. Regular Client

**Regular Client (with Anon Key):**
- Used in browser and server
- Limited permissions
- Cannot use admin APIs
- Safe to expose

**Admin Client (with Service Role Key):**
- Used only in backend/API routes
- Full permissions
- Can create users without email verification
- NEVER exposed to browser
- See `/lib/supabase/server.ts` → `createAdminClient()`
