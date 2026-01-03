# Security Hardening Guide

## Overview
This document outlines security hardening steps for the Bug Tracker application using Supabase.

## Database Security

### 1. Enable RLS on Profiles Table
The `profiles` table stores user metadata and should have Row Level Security (RLS) enabled to prevent unauthorized access.

```sql
-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profiles (existing trigger should handle this)
CREATE POLICY "Enable insert for authenticated users"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 2. Lock Search Path on Security Definer Functions
All `SECURITY DEFINER` functions should explicitly set `search_path = public` to prevent schema injection attacks.

**Example Pattern:**
```sql
CREATE OR REPLACE FUNCTION your_function_name()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function body
END;
$$;
```

**Functions to Audit:**
- Any function using `SECURITY DEFINER`
- Trigger functions (e.g., profile auto-creation trigger)
- RLS policy helper functions

### 3. Storage Security (Already Implemented)
✅ Bug images bucket is **private**
✅ Signed URLs with 1-year expiration
✅ Path isolation: `bugs/{userId}/{bugId}/filename`

### 4. Password Security
⚠️ **Supabase Pro Required**: The Supabase API leaks password reset information through timing attacks in free tier projects. On Pro plans, enable:
- `auth.security_update_password_require_reauthentication`
- Rate limiting on auth endpoints

**Current Mitigation (Free Tier):**
- Passwords stored in `auth.users` (not in `profiles`)
- No password column exposed in application schema

## Application Security

### 5. Environment Variables
Ensure `.env` file is never committed:
```bash
# .env (gitignored)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 6. Input Validation
✅ **Implemented:**
- Title length validation (max 100 chars)
- Description sanitization via markdown parsing
- Image file type validation (JPEG, PNG, GIF, WebP)
- Image size limit (5MB)

### 7. Activity Logging
✅ **Implemented:**
- All bug actions logged to `bug_activity` table
- Includes: status changes, comments, archive/restore/delete
- Actor tracked via `actor_id` and `actor_email`

## RLS Policies Checklist

### Bugs Table
- ✅ Users can view all bugs (public read)
- ✅ Users can insert their own bugs
- ✅ Users can update their own bugs
- ✅ Users can delete their own bugs

### Bug Activity Table
- ✅ All users can read activity (public read)
- ✅ Authenticated users can insert activity
- ⚠️ Consider restricting updates/deletes (activity should be immutable)

### Profiles Table
- ⚠️ **Action Required**: Enable RLS (see section 1)
- ⚠️ **Action Required**: Add read-own, update-own policies

## SQL Execution Instructions

**To apply these security hardening steps:**
1. Open Supabase SQL Editor: https://app.supabase.com/project/{project-id}/sql
2. Copy and execute the RLS policy statements from Section 1
3. Audit all `SECURITY DEFINER` functions and add `SET search_path = public`
4. Test RLS policies with different user roles

## Testing RLS Policies

```sql
-- Test as specific user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';

-- Attempt operations and verify access
SELECT * FROM profiles WHERE id = 'user-uuid-here'; -- Should succeed
SELECT * FROM profiles WHERE id = 'other-user-uuid'; -- Should fail
```

## Monitoring

### Security Audit Queries
```sql
-- Find tables without RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE schemaname = 'public'
  )
  AND rowsecurity = false;

-- List all SECURITY DEFINER functions
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND security_type = 'DEFINER';
```

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-security-label.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
