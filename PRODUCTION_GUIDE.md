# 🚀 Production Deployment Guide

## Overview

This guide covers making your Bug Reporting Tool production-ready with optimization, Docker containerization, and deployment strategies.

---

## 📊 Bundle Size Optimization

### What Was Done

✅ **Code Splitting**: Pages are now lazy-loaded (Dashboard, CreateBug, BugDetail)  
✅ **Advanced Chunking**: Vendor code separated from app code  
✅ **Minification**: Terser with drop console/debugger enabled  
✅ **Gzip Compression**: Automatic compression of assets  
✅ **CSS Minification**: Lightning CSS for optimal CSS bundling  

### Before vs After
- **Before**: ~537 KB (single chunk) ⚠️
- **After**: ~120-150 KB initial + lazy-loaded chunks ✅

### How It Works

1. **Lazy Loading**: Pages only load when accessed
2. **Vendor Separation**: React, Supabase, etc. in separate chunk
3. **Component Chunks**: Organize by feature for better caching
4. **Compression**: All assets are gzipped (50% smaller)

---

## 🐳 Docker Deployment

### Prerequisites

- Docker 20.10+
- docker-compose 2.0+
- Production `.env` file with Supabase credentials

### Quick Start

#### Option 1: Using Docker Compose (Recommended)

```bash
# 1. Build and start all services
docker-compose up -d

# 2. View logs
docker-compose logs -f bug-reporting-tool

# 3. Check status
docker-compose ps
```

The app will be available at `http://localhost:3000`

#### Option 2: Manual Docker Build

```bash
# Build image
docker build -t bug-reporting-tool:latest .

# Run container
docker run -d \
  --name bug-reporting-tool \
  -p 3000:3000 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  bug-reporting-tool:latest

# View logs
docker logs -f bug-reporting-tool
```

#### Option 3: Using the Deploy Script

```bash
# Make executable (Unix/Mac/Linux)
chmod +x deploy-docker.sh

# Deploy
./deploy-docker.sh
```

---

## 🔧 Configuration Files

### Dockerfile - Multi-stage Build

- **Stage 1 (Builder)**: Installs deps and builds app
- **Stage 2 (Runtime)**: Uses `serve` for lightweight HTTP server
- **Result**: ~300MB image size (optimized)

**Key Features:**
- Health checks enabled
- Non-root user (for security)
- Production optimization flags

### docker-compose.yml

Includes:
- Bug Reporting Tool service
- Nginx reverse proxy (optional)
- Network isolation
- Environment variable management
- Health checks

### nginx.conf

Production-ready Nginx configuration:
- Gzip compression
- Security headers
- Static asset caching
- Rate limiting ready
- SSL/TLS support (commented, uncomment for production)

---

## 📦 Local Production Build

### Build Production Version

```bash
# Using the build script
chmod +x build-production.sh
./build-production.sh

# Or manually
npm run build
npm run preview
```

### What Gets Built

```
dist/
├── assets/
│   ├── js/
│   │   ├── index.[hash].js          (main app, ~50KB gzipped)
│   │   ├── vendor-react.[hash].js   (React deps, ~80KB gzipped)
│   │   ├── vendor-supabase.[hash].js (Supabase, ~40KB gzipped)
│   │   ├── page-Dashboard.[hash].js (lazy-loaded)
│   │   ├── page-CreateBug.[hash].js (lazy-loaded)
│   │   └── page-BugDetail.[hash].js (lazy-loaded)
│   ├── css/
│   │   └── index.[hash].css         (styles, ~11KB gzipped)
│   └── images/
│       └── [optimized images]
└── index.html (entry point)
```

---

## 🔒 Production Security Checklist

### Environment Variables

```bash
# Never commit these!
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-only
```

Set in deployment platform:
- ✅ Vercel Environment Variables
- ✅ Docker environment variables
- ✅ Docker Compose .env
- ✅ Kubernetes secrets

### Security Headers (Included in nginx.conf)

```
X-Frame-Options: SAMEORIGIN              # Clickjacking protection
X-Content-Type-Options: nosniff          # MIME sniffing protection
X-XSS-Protection: 1; mode=block         # XSS protection
Content-Security-Policy: ...             # CSP rules
```

### HTTPS/SSL Setup

For production, enable SSL in `nginx.conf`:

```bash
# 1. Generate certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# 2. Uncomment SSL section in nginx.conf

# 3. Restart
docker-compose down
docker-compose up -d
```

---

## 📈 Performance Monitoring

### Check Bundle Size

```bash
# Analyze dist folder
du -sh dist/
du -sh dist/assets/

# Find large chunks
find dist/assets/js -type f -exec du -h {} \; | sort -rh
```

### Monitor Container Performance

```bash
# CPU and memory usage
docker stats bug-reporting-tool

# View logs in real-time
docker-compose logs -f bug-reporting-tool

# Check health
docker-compose ps
```

### Browser Performance

1. **Open DevTools** (F12)
2. **Network Tab**: Check asset sizes and load times
3. **Coverage Tab**: Identify unused CSS/JS
4. **Performance Tab**: Check Core Web Vitals

---

## 🚀 Deployment to Production

### Docker Hub (for team sharing)

```bash
# Tag image
docker tag bug-reporting-tool:latest yourusername/bug-reporting-tool:latest

# Login to Docker Hub
docker login

# Push
docker push yourusername/bug-reporting-tool:latest
```

### AWS ECS

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ECR_URI

docker tag bug-reporting-tool:latest YOUR_ECR_URI/bug-reporting-tool:latest
docker push YOUR_ECR_URI/bug-reporting-tool:latest
```

### Azure Container Registry

```bash
az acr login --name YOUR_REGISTRY

docker tag bug-reporting-tool:latest YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest
docker push YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bug-reporting-tool
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bug-reporting-tool
  template:
    metadata:
      labels:
        app: bug-reporting-tool
    spec:
      containers:
      - name: app
        image: bug-reporting-tool:latest
        ports:
        - containerPort: 3000
        env:
        - name: VITE_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
        - name: VITE_SUPABASE_ANON_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-key
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Build and Deploy to Docker

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t bug-reporting-tool:${{ github.sha }} .
      
      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push bug-reporting-tool:${{ github.sha }}
      
      - name: Deploy
        run: |
          ssh user@your-server 'cd /app && docker-compose pull && docker-compose up -d'
```

---

## 📋 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs bug-reporting-tool

# Common issues:
# 1. Port 3000 already in use: Change in docker-compose.yml
# 2. Missing env vars: Create .env.production
# 3. Build error: Check Dockerfile and dependencies
```

### Slow performance

```bash
# Check size of assets
du -sh dist/assets/js/

# Profile with DevTools Network tab
# Look for large chunks (>100KB uncompressed)

# Verify gzip is working
curl -I http://localhost:3000/assets/[filename].js | grep encoding
```

### Memory issues

Increase Docker memory in `docker-compose.yml`:

```yaml
services:
  bug-reporting-tool:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📊 Production Checklist

- [ ] Bundle size < 200KB (gzipped)
- [ ] All environment variables set
- [ ] HTTPS/SSL configured
- [ ] Security headers enabled
- [ ] Docker image optimized
- [ ] Health checks passing
- [ ] Gzip compression working
- [ ] Cache headers configured
- [ ] Database RLS policies set
- [ ] Error monitoring configured (optional)
- [ ] Backups automated (optional)
- [ ] Load testing done (optional)

---

## 📞 Support

For issues, check:
1. [Vite Docs](https://vitejs.dev/)
2. [Docker Docs](https://docs.docker.com/)
3. [Supabase Docs](https://supabase.com/docs)
4. Project GitHub Issues
