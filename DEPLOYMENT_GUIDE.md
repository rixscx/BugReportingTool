# 🚀 Deployment Guide

## Quick Summary of Fixes Applied

✅ **Fixed base path configuration** - Now dynamically supports both Vercel (/) and GitHub Pages (/BugReportingTool/)  
✅ **Fixed Supabase initialization** - Added error handling for missing environment variables  
✅ **Fixed router basename** - BrowserRouter now correctly uses BASE_URL from build config  
✅ **Updated deployment script** - Changed from gh-pages to vercel CLI  

---

## 🌐 Deploy to Vercel (Recommended)

### Option 1: Automatic Deployment (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Fix deployment configuration"
   git push
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL = https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY = your-anon-key-here
     ```
   - Redeploy automatically

4. **Done!** 🎉 Your app is live at `your-project.vercel.app`

### Option 2: Manual Deployment with Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy
vercel --prod

# Follow the prompts and set environment variables when asked
```

---

## 📚 Deploy to GitHub Pages

### Setup Instructions

1. **Update vite.config.js** (already done):
   - Base path is set to `process.env.VITE_BASE_PATH || '/'`

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Fix deployment configuration"
   git push origin main
   ```

3. **GitHub Actions Workflow** runs automatically:
   - Build logs available in GitHub → Actions tab
   - App deploys to `yourusername.github.io/BugReportingTool/`

### Manual Deployment (if needed)

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Build with GitHub Pages base path
VITE_BASE_PATH=/BugReportingTool/ npm run build

# Deploy
npx gh-pages -d dist
```

---

## 🔐 Environment Variables

### Required Variables

Both platforms need these variables set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Getting these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the URL and anon key

### Optional Variables

```env
VITE_BASE_PATH=/BugReportingTool/  # For GitHub Pages (GitHub Actions sets this)
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] App loads without blank screen
- [ ] Console shows no 404 errors for CSS/JS files
- [ ] Supabase connection works (can see auth page)
- [ ] Login functionality works
- [ ] Bugs can be created and viewed
- [ ] Real-time updates work (test in 2 browser tabs)

### If you see a blank page:

1. **Check Console** (F12):
   - Look for red errors
   - Look for "Missing Supabase environment variables" message
   - Look for 404 errors for assets

2. **Fix missing env vars**:
   - Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
   - Trigger a redeploy

3. **Check Supabase status**:
   - Verify project is active at supabase.com
   - Check RLS policies allow queries

---

## 🐛 Troubleshooting

### Build fails locally
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "Failed to load stylesheet/script" errors
- **Cause**: Wrong base path configuration
- **Fix**: Verify `vite.config.js` has `base: process.env.VITE_BASE_PATH || '/'`

### Supabase errors (401, 403)
- **Cause**: Invalid credentials or RLS policies blocking access
- **Fix**: 
  - Double-check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - Check Supabase RLS policies in dashboard
  - Verify API is enabled in Supabase project

### White screen with no errors
- **Cause**: Usually Supabase connection issue
- **Fix**: Check browser console for any errors, verify env vars

---

## 🚀 Production Best Practices

1. **Use environment variables**, never hardcode secrets
2. **Enable HTTPS** (both Vercel and GitHub Pages do this automatically)
3. **Monitor performance** with Vercel Analytics or Supabase Stats
4. **Set up auto-deployments** - Push to main branch = auto-deploy
5. **Use proper git workflow** - Test locally before pushing

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev
- **GitHub Pages Docs**: https://pages.github.com
