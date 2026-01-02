# 🚀 Quick Deployment Guide

## Choose Your Deployment Method

### 1️⃣ **Docker Compose** (5 minutes - Easiest)

```bash
# Step 1: Create production env file
cp .env.example .env.production

# Step 2: Edit with your Supabase credentials
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=xxx

# Step 3: Deploy
npm run docker:compose

# Step 4: Visit
# http://localhost:3000
```

**Pros:** Complete setup, Nginx included, easy to stop/restart  
**Cons:** Requires Docker installed locally

---

### 2️⃣ **Vercel** (3 minutes - Recommended)

```bash
# Step 1: Push to GitHub
git add .
git commit -m "Production ready"
git push origin main

# Step 2: Visit vercel.com
# Select your GitHub repo
# Vercel auto-detects Vite app

# Step 3: Set environment variables
# Go to Settings → Environment Variables
# Add:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY

# Step 4: Redeploy
# Your app is live at: your-project.vercel.app
```

**Pros:** Auto-deploys on push, free tier available, great performance  
**Cons:** Less control over infrastructure

---

### 3️⃣ **GitHub Pages** (2 minutes)

```bash
# Step 1: Push to main
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# Step 2: GitHub Actions runs automatically
# Check Actions tab for build status

# Step 3: Visit
# https://yourusername.github.io/BugReportingTool/

# That's it! Auto-deploys on every push
```

**Pros:** Free, simple, auto-deploys  
**Cons:** Limited server-side features, static hosting only

---

### 4️⃣ **AWS ECS** (15 minutes)

```bash
# Step 1: Build Docker image
npm run docker:build

# Step 2: Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ECR_URI

docker tag bug-reporting-tool:latest YOUR_ECR_URI/bug-reporting-tool:latest
docker push YOUR_ECR_URI/bug-reporting-tool:latest

# Step 3: Create ECS service with:
# - Docker image from ECR
# - Environment variables
# - Load balancer
# - Health checks (auto-configured)

# Step 4: Your app is live on AWS!
```

**Pros:** Highly scalable, managed service, auto-healing  
**Cons:** More complex setup, costs more

---

### 5️⃣ **Azure Container Instances** (10 minutes)

```bash
# Step 1: Build and push to ACR
az acr login --name YOUR_REGISTRY

docker tag bug-reporting-tool:latest YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest
docker push YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest

# Step 2: Create container instance
az container create \
  --resource-group myResourceGroup \
  --name bug-reporting-tool \
  --image YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest \
  --cpu 1 --memory 1 \
  --ports 80 443 \
  --environment-variables \
    VITE_SUPABASE_URL=xxx \
    VITE_SUPABASE_ANON_KEY=yyy

# Step 3: Your app is live!
```

---

### 6️⃣ **Railway** (5 minutes)

```bash
# Step 1: Connect your GitHub repo
# Visit railway.app

# Step 2: Select repository
# Choose: Bug Reporting Tool

# Step 3: Set environment variables
# Add Supabase credentials in Railway dashboard

# Step 4: Deploy
# Railway auto-deploys from your repo!
```

---

### 7️⃣ **Self-Hosted VPS** (20 minutes)

```bash
# Step 1: SSH into your server
ssh user@your-server.com

# Step 2: Install Docker & docker-compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Step 3: Clone your repo
git clone https://github.com/yourusername/BugReportingTool.git
cd BugReportingTool

# Step 4: Create .env.production
cp .env.example .env.production
# Edit with your credentials

# Step 5: Deploy
npm run docker:compose

# Step 6: Configure reverse proxy
# Point your domain to your server IP
# Update nginx.conf with your domain
# Uncomment SSL section and add certificates

# Step 7: Your app is live!
```

---

## 📊 Comparison Table

| Method | Setup Time | Cost | Scalability | Ease | Auto-Deploy |
|--------|-----------|------|-------------|------|-------------|
| Docker Compose | 5 min | Free | Low | ⭐⭐⭐⭐⭐ | Manual |
| Vercel | 3 min | Free | High | ⭐⭐⭐⭐⭐ | ✅ Yes |
| GitHub Pages | 2 min | Free | Low | ⭐⭐⭐⭐⭐ | ✅ Yes |
| AWS ECS | 15 min | Medium | Very High | ⭐⭐⭐ | ✅ Yes |
| Azure ACI | 10 min | Medium | Medium | ⭐⭐⭐ | ✅ Yes |
| Railway | 5 min | Low-Medium | High | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Self-Hosted VPS | 20 min | Low-Medium | Medium | ⭐⭐⭐ | Manual |

---

## 🎯 My Recommendation

**For Development/Testing:** Docker Compose  
**For Small Projects:** Vercel or Railway  
**For Enterprise:** AWS ECS or Kubernetes  
**For Full Control:** Self-Hosted VPS  

---

## ✅ Verification Checklist

After deployment, verify:

```bash
# 1. App loads without errors
curl https://your-deployed-app.com

# 2. Check HTTP response
curl -I https://your-deployed-app.com
# Should see: 200 OK

# 3. Check gzip compression
curl -I -H "Accept-Encoding: gzip" https://your-deployed-app.com
# Should see: Content-Encoding: gzip

# 4. Check security headers
curl -I https://your-deployed-app.com | grep -i "X-Frame-Options"
# Should see X-Frame-Options header

# 5. Test browser
# Visit app in browser
# Press F12 to open DevTools
# Check Network tab - all files should load
# Check Console - no red errors
```

---

## 🔧 Environment Variables

These MUST be set in your deployment platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to set them:**

- **Vercel:** Settings → Environment Variables
- **AWS ECS:** Task Definition → Container Definitions → Environment
- **Azure:** Container Instance → Environment variables
- **Railway:** Variables in dashboard
- **GitHub Pages:** N/A (static only)
- **Docker:** .env.production file

---

## 🚨 Troubleshooting

### "Build failed"
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### "Blank white screen"
```bash
# Check console (F12)
# Likely missing environment variables
# Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
```

### "404 Not Found on all routes"
```bash
# Check base path is correct
# For Vercel/Railway: should be '/'
# For GitHub Pages: should be '/BugReportingTool/'
# Check vite.config.js base setting
```

### "Docker won't start"
```bash
docker-compose logs bug-reporting-tool
# Check output for errors
# Common: port 3000 already in use
# Fix: change port in docker-compose.yml
```

### "Slow page loads"
```bash
# Check Network tab in DevTools
# Look for:
# - Large uncompressed files (should be gzipped)
# - Slow API responses (Supabase)
# - Missing or broken images
```

---

## 📞 Support Resources

- **Vite Issues:** https://github.com/vitejs/vite/issues
- **Vercel Issues:** https://vercel.com/support
- **Supabase Issues:** https://github.com/supabase/supabase/discussions
- **Docker Help:** https://docs.docker.com/
- **GitHub Pages:** https://docs.github.com/en/pages

---

## 🎉 You're Done!

Your app is production-ready and deployed! 

**Next steps:**
1. Monitor performance
2. Set up error tracking (Sentry)
3. Set up analytics (Vercel, Plausible, etc.)
4. Configure backups
5. Set up CI/CD pipeline

Enjoy your production deployment! 🚀
