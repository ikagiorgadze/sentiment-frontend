# Deployment Summary - sentiment-frontend

Quick reference guide for deploying the sentiment-frontend to EC2.

## Overview

**Deployment Type**: Static build served by nginx  
**Port**: 80 (HTTP)  
**Build Location**: GitHub Actions runner  
**Deployment Method**: SSH + rsync  
**Web Server**: nginx  

## Architecture

```
GitHub Actions
     │
     │ 1. Build (npm run build)
     │
     ▼
   dist/
     │
     │ 2. rsync → EC2
     │
     ▼
/var/www/sentiment-frontend/
     │
     │ 3. nginx serves
     │
     ▼
   Port 80 (Public)
     │
     ├─► /            → Static files (HTML, CSS, JS)
     ├─► /api/        → Proxy → localhost:3000 (Backend)
     └─► /webhook/    → Proxy → localhost:5678 (n8n)
```

## Quick Start

### 1. Prerequisites

On EC2:
```bash
# Install nginx
sudo apt-get update && sudo apt-get install -y nginx

# Enable and start nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. GitHub Secrets

Add to repository Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 public IP |
| `EC2_USER` | SSH username (ubuntu) |
| `EC2_SSH_KEY` | Private SSH key |

Optional:
| Secret | Value | Default |
|--------|-------|---------|
| `VITE_API_BASE_URL` | API base URL | `/api` |
| `VITE_AI_ASSISTANT_URL` | n8n chat webhook | Not set |

### 3. Deploy

**Option A**: Push to main
```bash
git push origin main
```

**Option B**: Manual trigger
1. Go to Actions tab on GitHub
2. Click "Deploy Frontend to EC2"
3. Click "Run workflow"

### 4. Verify

```bash
# Test health endpoint
curl http://YOUR_EC2_IP/frontend-health

# Test homepage
curl http://YOUR_EC2_IP/

# Test API proxy (requires backend)
curl http://YOUR_EC2_IP/api/health
```

## Files

### Workflow
- `.github/workflows/deploy.yml` - GitHub Actions workflow

### Scripts
- `scripts/deploy.sh` - Main deployment script
- `scripts/setup-nginx.sh` - nginx installation and setup
- `scripts/health-check.sh` - Post-deployment verification

### Configuration
- `nginx.prod.conf` - nginx production configuration
- `vite.config.ts` - Vite build configuration

### Documentation
- `GITHUB_ACTIONS_SETUP.md` - Detailed setup guide
- `TROUBLESHOOTING.md` - Problem solving guide
- `_DEPLOYMENT_ARCHITECTURE.md` - Architecture details (breadcrumb)
- `_ENVIRONMENT_VARIABLES.md` - Environment variables reference (breadcrumb)

## Deployment Steps

The workflow performs these steps:

1. **Checkout code** from repository
2. **Setup Node.js** 20 with npm cache
3. **Install dependencies** (`npm ci`)
4. **Build application** (`npm run build` with VITE_* env vars)
5. **Setup SSH** for EC2 connection
6. **Test SSH** connection
7. **Copy built files** (rsync dist/ → /tmp/sentiment-frontend-dist/)
8. **Copy deployment files** (scripts, nginx.prod.conf → /tmp/sentiment-frontend-deploy/)
9. **Deploy to nginx** (run deploy.sh)
10. **Health check** (run health-check.sh)

## Key Features

### nginx Configuration
- **Static file serving**: Serves built files from `/var/www/sentiment-frontend`
- **API proxy**: `/api/*` → `localhost:3000/api/*` (no CORS issues)
- **Webhook proxy**: `/webhook/*` → `localhost:5678/webhook/*`
- **SPA fallback**: All routes serve `index.html` (React Router support)
- **Gzip compression**: Reduces file sizes
- **Static caching**: 1-year cache for assets
- **Security headers**: X-Content-Type-Options, etc.

### Build Process
- **Build-time env vars**: VITE_* variables baked into bundle
- **Tree shaking**: Unused code removed
- **Code splitting**: Separate vendor and app bundles
- **Minification**: Reduced bundle size

## Environment Variables

### Build-Time (VITE_*)
These are embedded in the JavaScript bundle during build:

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `/api` | No |
| `VITE_AI_ASSISTANT_URL` | n8n AI assistant webhook | - | No |

⚠️ **Important**: These values are **public** and visible in the browser. Never put secrets here.

### How to Set
Add to GitHub Secrets, they're used in the workflow:
```yaml
env:
  VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
  VITE_AI_ASSISTANT_URL: ${{ secrets.VITE_AI_ASSISTANT_URL }}
run: npm run build
```

## Manual Deployment

If you need to deploy manually without GitHub Actions:

```bash
# 1. Build locally
npm ci
npm run build

# 2. Copy to EC2
rsync -avz --delete dist/ ubuntu@YOUR_EC2_IP:/tmp/sentiment-frontend-dist/
rsync -avz scripts/ nginx.prod.conf ubuntu@YOUR_EC2_IP:/tmp/sentiment-frontend-deploy/

# 3. Deploy
ssh ubuntu@YOUR_EC2_IP "cd /tmp/sentiment-frontend-deploy && chmod +x *.sh && ./deploy.sh"

# 4. Health check
ssh ubuntu@YOUR_EC2_IP "cd /tmp/sentiment-frontend-deploy && ./health-check.sh"
```

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| 502 Bad Gateway on /api | Backend not running: `pm2 start sentiment-backend` |
| 404 on all routes | Missing SPA fallback in nginx config |
| CORS errors | Not using `/api` path, using direct backend URL |
| nginx won't start | Port 80 in use: `sudo lsof -ti:80 \| xargs sudo kill` |
| Build fails | Run `npm ci && npm run build` locally first |

See `TROUBLESHOOTING.md` for detailed solutions.

## Health Check

After deployment, the health check verifies:

✅ nginx service is running  
✅ nginx is listening on port 80  
✅ Frontend files deployed to /var/www/sentiment-frontend  
✅ nginx configuration is valid  
✅ nginx site is enabled  
✅ Frontend health endpoint responding  
✅ Frontend homepage accessible  
⚠️ API proxy working (warning if backend not deployed)  
⚠️ Webhook proxy working (warning if n8n not configured)  

## Monitoring

### Logs
```bash
# nginx access log
sudo tail -f /var/log/nginx/access.log

# nginx error log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -xeu nginx
```

### Status
```bash
# nginx status
sudo systemctl status nginx

# Port 80 status
sudo netstat -tlnp | grep :80

# Deployed files
ls -la /var/www/sentiment-frontend

# nginx config
cat /etc/nginx/sites-available/sentiment-frontend
```

## Dependencies

### Required on EC2
- nginx
- SSH access
- sudo privileges

### Required for full functionality
- sentiment-backend running on port 3000
- sentiment-infra running (PostgreSQL, n8n)

## Security

✅ **Safe**:
- Frontend files are public (expected)
- VITE_* env vars are public (by design)
- Port 80 is open (HTTP)

⚠️ **Be Careful**:
- Never put secrets in VITE_* variables
- Backend should implement authentication
- Consider adding HTTPS for production

## Next Steps After Deployment

1. **Test frontend access**: Open `http://YOUR_EC2_IP/` in browser
2. **Deploy backend**: If not already deployed, see `../sentiment-backend/`
3. **Test API integration**: Verify frontend can call backend APIs
4. **Configure domain**: Optional, set up Route 53 or DNS
5. **Add HTTPS**: Optional, use Let's Encrypt/Certbot
6. **Set up monitoring**: Optional, add CloudWatch or similar

## Related Documentation

- **Detailed setup**: `GITHUB_ACTIONS_SETUP.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Backend deployment**: `../sentiment-backend/GITHUB_ACTIONS_SETUP.md`
- **Infrastructure**: `../sentiment-infra/GITHUB_ACTIONS_SETUP.md`

## Quick Commands

```bash
# Check deployment
ssh ubuntu@YOUR_EC2_IP "ls -la /var/www/sentiment-frontend"

# Test health
curl http://YOUR_EC2_IP/frontend-health

# View logs
ssh ubuntu@YOUR_EC2_IP "sudo tail -f /var/log/nginx/error.log"

# Restart nginx
ssh ubuntu@YOUR_EC2_IP "sudo systemctl restart nginx"

# Run health check
ssh ubuntu@YOUR_EC2_IP "cd /tmp/sentiment-frontend-deploy && ./health-check.sh"

# Redeploy manually
ssh ubuntu@YOUR_EC2_IP "cd /tmp/sentiment-frontend-deploy && ./deploy.sh"
```

## Support

For issues:
1. Check `TROUBLESHOOTING.md`
2. Check workflow logs in GitHub Actions
3. Check nginx logs on EC2
4. Run `health-check.sh` for diagnostics
