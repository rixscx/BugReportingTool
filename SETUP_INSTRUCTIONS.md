# Setup Instructions

## 1. Email Verification Redirect Configuration

### Supabase Dashboard Settings

1. Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - `http://localhost:5173/`
   - `https://your-production-domain.com/`
   - `https://your-vercel-app.vercel.app/` (if using Vercel)

3. Set **Site URL** to:
   - Development: `http://localhost:5173`
   - Production: `https://your-production-domain.com`

## 2. Mark Test Users as Verified

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Mark test users as email verified
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN ('test.user@gmail.com', 'test.admin@gmail.com');

-- Verify the update
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('test.user@gmail.com', 'test.admin@gmail.com');
```

## 3. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Select **Web application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `https://your-supabase-project.supabase.co`
7. Add **Authorized redirect URIs**:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
8. Copy your **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** and enable it
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

## 4. Test the Setup

### Email Verification
1. Sign up with a new email
2. Check your inbox for verification email
3. Click the link - it should redirect to your app homepage
4. You should be automatically signed in

### Test Users Login
1. Try signing in with `test.user@gmail.com` or `test.admin@gmail.com`
2. Should work without email verification

### Google OAuth
1. Click "Sign in with Google" button
2. Select your Google account
3. Grant permissions
4. Should redirect back and create profile automatically

## Troubleshooting

### Email not redirecting after verification
- Check **Redirect URLs** in Supabase dashboard
- Ensure **Site URL** is correctly set
- Clear browser cache and try again

### Google OAuth not working
- Verify redirect URI matches exactly: `https://your-project.supabase.co/auth/v1/callback`
- Check that JavaScript origins include your Supabase URL
- Ensure Google OAuth is enabled in Supabase

### Test users can't sign in
- Run the SQL script to verify emails
- Check that users exist in `auth.users` table
- Verify passwords are correct

## Environment Variables

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema for Google OAuth Users

The app automatically creates profiles for Google OAuth users. The profile will have:
- `id` - from Google auth
- `email` - from Google account
- `username` - extracted from email
- `role` - defaults to 'user'
- `avatar_url` - from Google profile picture (if available)

## Additional Security Notes

1. **PKCE Flow**: The app now uses PKCE (Proof Key for Code Exchange) for enhanced security
2. **Session Persistence**: Sessions are stored in localStorage
3. **Auto Refresh**: Tokens automatically refresh before expiration
4. **URL Detection**: Session tokens in URL are automatically detected and stored
