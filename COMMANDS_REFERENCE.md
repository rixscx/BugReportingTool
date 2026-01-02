# 🔧 Command Reference Guide

## 📦 Build & Development Commands

### Local Development
```bash
npm run dev              # Start dev server (hot reload)
npm run build          # Build for production
npm run preview        # Preview production build locally
npm run lint           # Run ESLint checks
npm run build:prod     # Build + lint (recommended)
npm run analyze        # Analyze bundle size
```

### Docker Commands
```bash
npm run docker:build    # Build Docker image
npm run docker:run      # Run single container
npm run docker:compose  # Start full stack (docker-compose)
npm run docker:logs     # View container logs
npm run docker:stop     # Stop docker-compose
npm run docker:clean    # Remove all containers/volumes
```

---

## 🐳 Docker CLI Commands

### Build Docker Image
```bash
# Build with default tag
docker build -t bug-reporting-tool:latest .

# Build with specific tag
docker build -t myregistry/bug-reporting-tool:v1.0 .

# Build with build args (if needed)
docker build -t bug-reporting-tool:latest \
  --build-arg NODE_ENV=production .
```

### Run Docker Container
```bash
# Run with env vars
docker run -d \
  --name bug-reporting-tool \
  -p 3000:3000 \
  -e VITE_SUPABASE_URL=https://xxx.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=your-key \
  bug-reporting-tool:latest

# Run with env file
docker run -d \
  --name bug-reporting-tool \
  -p 3000:3000 \
  --env-file .env.production \
  bug-reporting-tool:latest

# Run with volume mount (development)
docker run -d \
  --name bug-reporting-tool \
  -p 3000:3000 \
  -v $(pwd)/src:/app/src \
  bug-reporting-tool:latest

# View logs
docker logs bug-reporting-tool

# Tail logs
docker logs -f bug-reporting-tool

# Stop container
docker stop bug-reporting-tool

# Remove container
docker rm bug-reporting-tool
```

### Docker Compose Commands
```bash
# Start all services
docker-compose up -d

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs

# Tail logs
docker-compose logs -f bug-reporting-tool

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Check status
docker-compose ps

# Execute command in running container
docker-compose exec bug-reporting-tool sh

# Restart service
docker-compose restart bug-reporting-tool
```

### Docker Registry Commands
```bash
# Login to Docker Hub
docker login

# Tag image
docker tag bug-reporting-tool:latest myusername/bug-reporting-tool:latest

# Push to Docker Hub
docker push myusername/bug-reporting-tool:latest

# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ECR_URI

# Tag for ECR
docker tag bug-reporting-tool:latest YOUR_ECR_URI/bug-reporting-tool:latest

# Push to ECR
docker push YOUR_ECR_URI/bug-reporting-tool:latest

# Login to Azure ACR
az acr login --name YOUR_REGISTRY

# Tag for Azure
docker tag bug-reporting-tool:latest YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest

# Push to Azure
docker push YOUR_REGISTRY.azurecr.io/bug-reporting-tool:latest
```

---

## 🔍 Inspection Commands

### Check Bundle Size
```bash
# macOS/Linux
du -sh dist/
du -sh dist/assets/

# Windows PowerShell
(Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB

# Find largest chunks
find dist/assets/js -type f -exec du -h {} \; | sort -rh
```

### Check Gzip Compression
```bash
# macOS/Linux
ls -lh dist/assets/js/*.gz

# Windows
dir dist\assets\js\*.gz

# Check compression ratio
for file in dist/assets/js/*.js; do
  gzip_size=$(stat -f%z "$file.gz" 2>/dev/null || stat -c%s "$file.gz" 2>/dev/null)
  orig_size=$(wc -c < "$file")
  ratio=$((100 - (gzip_size * 100 / orig_size)))
  echo "$file: $ratio% smaller"
done
```

### Monitor Container Resources
```bash
# CPU and memory usage
docker stats bug-reporting-tool

# Watch continuously
docker stats --no-stream=false bug-reporting-tool

# Get container info
docker inspect bug-reporting-tool

# Get container logs
docker logs --tail 50 bug-reporting-tool

# Get logs since specific time
docker logs --since 2026-01-02T00:00:00 bug-reporting-tool
```

---

## 📤 Deployment Commands

### Git Commands
```bash
# Stage all changes
git add .

# Commit changes
git commit -m "Production ready with optimization"

# Push to main
git push origin main

# Push to specific branch
git push origin feature-branch

# View commit history
git log --oneline -10
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Check deployment status
vercel status

# View deployment logs
vercel logs
```

### GitHub Pages Deployment
```bash
# No manual deployment needed!
# GitHub Actions automatically deploys on push to main

# Check deployment status
# 1. Go to GitHub repo
# 2. Click "Actions" tab
# 3. View workflow status
```

### AWS ECS Deployment
```bash
# Configure AWS credentials
aws configure

# Create ECR repository
aws ecr create-repository --repository-name bug-reporting-tool

# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ECR_URI

# Push image to ECR
docker push YOUR_ECR_URI/bug-reporting-tool:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name bug-tracker

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster bug-tracker \
  --service-name bug-app \
  --task-definition bug-app:1 \
  --desired-count 1
```

### Azure Deployment
```bash
# Login to Azure
az login

# Create container registry
az acr create --resource-group mygroup --name myregistry --sku Basic

# Login to ACR
az acr login --name myregistry

# Push image
docker push myregistry.azurecr.io/bug-reporting-tool:latest

# Create container instance
az container create \
  --resource-group mygroup \
  --name bug-app \
  --image myregistry.azurecr.io/bug-reporting-tool:latest \
  --cpu 1 --memory 1.5 \
  --registry-login-server myregistry.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --ports 80 443 \
  --environment-variables \
    VITE_SUPABASE_URL=xxx \
    VITE_SUPABASE_ANON_KEY=yyy
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs

# Set environment variables
railway variables set VITE_SUPABASE_URL=xxx
railway variables set VITE_SUPABASE_ANON_KEY=yyy
```

---

## 🔐 Environment Setup

### Create .env.production
```bash
# Copy template
cp .env.example .env.production

# Edit with your credentials
nano .env.production
# or
code .env.production

# Content should be:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_BASE_PATH=/  # For Vercel/root deployment
```

### Verify Environment Variables
```bash
# Check if env file exists
ls -la .env.production

# View env variables (be careful!)
cat .env.production

# Set env variables in current shell
export VITE_SUPABASE_URL=xxx
export VITE_SUPABASE_ANON_KEY=yyy

# Check set variables
echo $VITE_SUPABASE_URL
```

---

## 🧪 Testing Commands

### Local Testing
```bash
# Build and preview
npm run build
npm run preview
# Visit: http://localhost:4173

# Test with Docker
docker build -t bug-reporting-tool .
docker run -p 3000:3000 bug-reporting-tool
# Visit: http://localhost:3000
```

### Health Checks
```bash
# Check app is running
curl http://localhost:3000

# Check health endpoint
curl http://localhost:3000/health

# Check with headers
curl -I http://localhost:3000
curl -I -H "Accept-Encoding: gzip" http://localhost:3000

# Check HTTPS (when deployed)
curl -I https://your-app.vercel.app
curl -I https://your-app.example.com
```

### Performance Testing
```bash
# Using curl
time curl http://localhost:3000

# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/

# Using wrk (advanced)
wrk -t4 -c100 -d30s http://localhost:3000/

# Using K6 (load testing)
k6 run load-test.js
```

---

## 🧹 Cleanup Commands

### Clean Build Artifacts
```bash
# Remove dist folder
rm -rf dist

# Remove node_modules
rm -rf node_modules

# Clear npm cache
npm cache clean --force

# Remove package-lock.json
rm package-lock.json

# Clean everything
npm run clean 2>/dev/null || true
```

### Clean Docker Resources
```bash
# Remove all containers
docker container prune

# Remove all images
docker image prune

# Remove all volumes
docker volume prune

# Remove all unused resources
docker system prune -a

# Remove specific container
docker rm bug-reporting-tool

# Remove specific image
docker rmi bug-reporting-tool:latest

# Remove all dangling images
docker image prune -a --filter "until=24h"
```

---

## 📊 Monitoring Commands

### Local Development
```bash
# Monitor file changes
npm run dev -- --watch

# Run with verbose output
npm run build -- --debug

# Show build time
npm run build -- --logLevel silent
```

### Production Monitoring
```bash
# Monitor Docker container
docker stats bug-reporting-tool

# View container resource limits
docker inspect -f '{{json .HostConfig.Memory}}' bug-reporting-tool

# Get container events
docker events --filter container=bug-reporting-tool

# Monitor network usage
docker stats --format "{{.Container}}: {{.NetIO}}"

# Check Vercel deployment
vercel ls

# Check GitHub Actions
gh workflow list

# View GitHub Actions logs
gh run list --repo owner/repo
gh run view <run-id>
```

---

## 🚨 Troubleshooting Commands

### Check Logs
```bash
# Docker logs
docker-compose logs bug-reporting-tool

# Nginx logs (inside container)
docker exec bug-reporting-tool cat /var/log/nginx/error.log

# Browser console
# Press F12 in browser → Console tab

# Server logs
tail -f /var/log/docker.log
tail -f /var/log/syslog
```

### Debug Issues
```bash
# Check port availability
lsof -i :3000          # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Check DNS resolution
nslookup your-app.example.com

# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Verify HTTPS
openssl s_client -connect your-app.example.com:443

# Check response headers
curl -I https://your-app.example.com

# Check gzip encoding
curl -H "Accept-Encoding: gzip" https://your-app.example.com -I
```

---

## 📚 Useful Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc

# Docker shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcs='docker-compose ps'

# Build shortcuts
alias build='npm run build:prod'
alias dev='npm run dev'
alias preview='npm run preview'
alias analyze='npm run analyze'

# Docker app shortcuts
alias dbuild='npm run docker:build'
alias drun='npm run docker:compose'
alias dstop='npm run docker:stop'
alias dlogs='npm run docker:logs'

# Git shortcuts
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline -10'
```

---

## 🎯 Quick Reference

### Common Workflows

**Development Workflow:**
```bash
npm run dev              # Start dev server
# Edit code...
npm run build:prod      # Build production
npm run preview         # Test production build
# Everything looks good?
git add .
git commit -m "Feature complete"
git push                # Auto-deploys to Vercel
```

**Docker Deployment:**
```bash
cp .env.example .env.production
# Edit .env.production with credentials
npm run docker:compose  # Start services
docker-compose logs -f  # Monitor
# Visit http://localhost:3000
```

**Bundle Analysis:**
```bash
npm run build           # Build first
npm run analyze         # See sizes
# Identify large chunks
# Optimize imports if needed
```

**Production Checklist:**
```bash
npm run build:prod      # Build with lint
npm run preview         # Test locally
# Verify in browser
docker build -t app .   # Build Docker image
docker run -p 3000:3000 app  # Test Docker
# Ready to deploy!
```

---

This comprehensive command reference covers all operations needed to develop, test, build, and deploy your Bug Reporting Tool!
