# GitHub Actions Setup - sentiment-frontend

This guide explains how to set up GitHub Actions for automated deployment of the sentiment-frontend to your EC2 instance.

## Overview

The frontend deployment workflow:
1. **Builds** the React/Vite application in the GitHub Actions runner
2. **Copies** the built `dist/` files to the EC2 instance
3. **Deploys** the files to nginx at `/var/www/sentiment-frontend`
4. **Configures** nginx to serve the frontend and proxy API/webhook requests
5. **Verifies** the deployment with health checks

## Prerequisites

### 1. EC2 Instance Setup

Your EC2 instance must have:

- **nginx installed**: Run `sudo apt-get install -y nginx`
- **Port 80 open**: Security group must allow HTTP traffic from 0.0.0.0/0
- **SSH access**: Security group must allow SSH (port 22) from GitHub Actions IPs
- **Backend running** (optional): For full functionality, deploy sentiment-backend first
- **Infrastructure running** (optional): For full functionality, deploy sentiment-infra first

**One-time setup on EC2:**

```bash
# Install nginx
sudo apt-get update
sudo apt-get install -y nginx

# Enable and start nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify nginx is running
sudo systemctl status nginx
```

### 2. Required GitHub Secrets

Navigate to your repository settings: **Settings → Secrets and variables → Actions → New repository secret**

Add the following **required secrets**:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `EC2_HOST` | EC2 instance public IP or hostname | `54.123.45.67` |
| `EC2_USER` | SSH username (usually ubuntu or ec2-user) | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | `-----BEGIN RSA PRIVATE KEY-----...` |

**Optional secrets** (for build-time environment variables):

| Secret Name | Description | Example Value | Default |
|------------|-------------|---------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `/api` | `/api` (uses nginx proxy) |
| `VITE_AI_ASSISTANT_URL` | n8n AI assistant webhook URL | `/webhook/chat` | Not set |

> **Note**: If you don't set `VITE_API_BASE_URL`, the frontend will use `/api` as the default, which works with the nginx proxy configuration.

### 3. SSH Key Setup

If you don't already have an SSH key pair for GitHub Actions:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions-frontend" -f ~/.ssh/github-actions-frontend -N ""

# Copy the public key to your EC2 instance
ssh-copy-id -i ~/.ssh/github-actions-frontend.pub ubuntu@YOUR_EC2_IP

# Test the connection
ssh -i ~/.ssh/github-actions-frontend ubuntu@YOUR_EC2_IP "echo 'SSH connection successful'"

# Copy the PRIVATE key content and add it to GitHub Secrets as EC2_SSH_KEY
cat ~/.ssh/github-actions-frontend
```

## GitHub Secrets Setup Guide

### Step 1: Get EC2 Information

```bash
# Get your EC2 public IP (if you don't know it)
curl http://checkip.amazonaws.com

# Verify SSH user (usually ubuntu for Ubuntu AMIs, ec2-user for Amazon Linux)
ssh ubuntu@YOUR_EC2_IP "whoami"
```

### Step 2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

**EC2_HOST:**
- Name: `EC2_HOST`
- Value: Your EC2 public IP (e.g., `54.123.45.67`)

**EC2_USER:**
- Name: `EC2_USER`
- Value: Your SSH username (e.g., `ubuntu` or `ec2-user`)

**EC2_SSH_KEY:**
- Name: `EC2_SSH_KEY`
- Value: Your complete private SSH key including the header and footer:
  ```
  -----BEGIN RSA PRIVATE KEY-----
  MIIEpAIBAAKCAQEA...
  ... (many lines) ...
  -----END RSA PRIVATE KEY-----
  ```

**VITE_API_BASE_URL (optional):**
- Name: `VITE_API_BASE_URL`
- Value: `/api` (or your custom API base URL)
- **Note**: Only needed if you want to override the default

**VITE_AI_ASSISTANT_URL (optional):**
- Name: `VITE_AI_ASSISTANT_URL`
- Value: Your n8n chat webhook URL (e.g., `/webhook/chat/abc123`)
- **Note**: Only needed if you have an AI assistant feature

### Step 3: Verify Secrets

After adding secrets, you should see them listed (values are hidden):

```
EC2_HOST          ••••••••
EC2_USER          ••••••••
EC2_SSH_KEY       ••••••••
```

## Workflow Configuration

The workflow is located at `.github/workflows/deploy.yml` and runs on:
- **Push to main branch**: Automatically deploys when you push to `main`
- **Manual trigger**: Use the "Run workflow" button in the Actions tab

### Workflow Steps

```yaml
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (npm ci)
4. Build application (npm run build)
   - Includes VITE_* environment variables from secrets
5. Setup SSH
6. Test SSH connection
7. Copy built files to EC2
8. Copy deployment scripts to EC2
9. Deploy to nginx
10. Health check
```

### Build-Time Environment Variables

Environment variables prefixed with `VITE_` are **baked into the bundle at build time**. They are **not** runtime configurable.

The workflow includes these variables in the build step:

```yaml
- name: Build application
  env:
    VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
    VITE_AI_ASSISTANT_URL: ${{ secrets.VITE_AI_ASSISTANT_URL }}
  run: npm run build
```

**Important**: These values are compiled into the JavaScript bundle and **will be visible** in the browser's DevTools. Never put sensitive information in `VITE_*` variables.

## Manual Deployment

To manually trigger a deployment:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **Deploy Frontend to EC2** workflow
4. Click **Run workflow** dropdown
5. Select the branch (usually `main`)
6. Click **Run workflow**

## Troubleshooting

### SSH Connection Issues

**Problem**: `Permission denied (publickey)` or connection timeout

**Solutions**:
1. Verify EC2 security group allows SSH from GitHub Actions IPs:
   ```bash
   # Check current security group rules
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```
   
2. Verify SSH key is correct:
   ```bash
   # Test SSH connection locally with the same key
   ssh -i ~/.ssh/github-actions-frontend ubuntu@YOUR_EC2_IP
   ```

3. Check that the public key is in `~/.ssh/authorized_keys` on EC2:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cat ~/.ssh/authorized_keys"
   ```

### Build Failures

**Problem**: `npm ci` or `npm run build` fails

**Solutions**:
1. Check workflow logs for specific error messages
2. Verify `package.json` and `package-lock.json` are in sync:
   ```bash
   # Locally regenerate package-lock.json
   rm package-lock.json
   npm install
   git add package-lock.json
   git commit -m "Update package-lock.json"
   ```

3. Check for TypeScript errors:
   ```bash
   # Run build locally first
   npm run build
   ```

### nginx Configuration Issues

**Problem**: nginx configuration test fails

**Solutions**:
1. Check nginx error logs on EC2:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo tail -n 50 /var/log/nginx/error.log"
   ```

2. Verify `nginx.prod.conf` syntax:
   ```bash
   # On EC2
   sudo nginx -t
   ```

3. Manually test nginx configuration:
   ```bash
   # Copy config to EC2 and test
   scp nginx.prod.conf ubuntu@YOUR_EC2_IP:/tmp/
   ssh ubuntu@YOUR_EC2_IP "sudo nginx -t -c /tmp/nginx.prod.conf"
   ```

### Port 80 Access Issues

**Problem**: Cannot access frontend on port 80

**Solutions**:
1. Verify EC2 security group allows HTTP:
   - Inbound rule: Type=HTTP, Port=80, Source=0.0.0.0/0

2. Check nginx is listening on port 80:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo netstat -tlnp | grep :80"
   ```

3. Check nginx is running:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo systemctl status nginx"
   ```

### API Proxy Not Working

**Problem**: Frontend can't reach backend API

**Solutions**:
1. Verify backend is running on port 3000:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "netstat -tlnp | grep :3000"
   ```

2. Test API proxy directly:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "curl -v http://localhost/api/health"
   ```

3. Check nginx proxy configuration:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cat /etc/nginx/sites-available/sentiment-frontend | grep -A 10 'location /api'"
   ```

4. Check backend logs:
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cd ~/sentiment-backend && pm2 logs sentiment-backend"
   ```

## Verification

After deployment, verify everything is working:

### 1. Check Workflow Status

- Go to **Actions** tab in GitHub
- Latest workflow should show green checkmark ✅
- Click on the workflow run to see detailed logs

### 2. Test Frontend Access

```bash
# Test from your local machine
curl http://YOUR_EC2_IP/

# Should return HTML content starting with <!DOCTYPE html>
```

### 3. Test Health Endpoint

```bash
curl http://YOUR_EC2_IP/frontend-health

# Should return: healthy
```

### 4. Test API Proxy

```bash
curl http://YOUR_EC2_IP/api/health

# Should return backend health status (if backend is running)
```

### 5. Test in Browser

1. Open browser and go to `http://YOUR_EC2_IP/`
2. Frontend should load
3. Open DevTools → Network tab
4. API calls should go to `/api/*` (same origin)
5. No CORS errors should appear

### 6. SSH to EC2 and Check

```bash
# SSH to EC2
ssh ubuntu@YOUR_EC2_IP

# Check nginx status
sudo systemctl status nginx

# Check deployed files
ls -la /var/www/sentiment-frontend

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Run health check script
cd /tmp/sentiment-frontend-deploy
./health-check.sh
```

## Production Checklist

Before deploying to production, ensure:

- ✅ All GitHub secrets are configured
- ✅ EC2 security groups allow HTTP (80) and SSH (22)
- ✅ nginx is installed and running on EC2
- ✅ Backend is deployed and accessible on port 3000
- ✅ Infrastructure (PostgreSQL, n8n) is deployed and running
- ✅ SSH key pair is created and public key is on EC2
- ✅ Test deployment to staging/dev environment first
- ✅ Environment variables are correctly set (if needed)
- ✅ nginx configuration is tested and valid

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ EC2 Instance                                                     │
│                                                                  │
│  ┌─────────────────┐                                            │
│  │ nginx :80       │                                            │
│  │ (Public)        │                                            │
│  │                 │                                            │
│  │ Static Files    │─────┐                                      │
│  │ /var/www/       │     │ Serves HTML, CSS, JS                │
│  │ sentiment-      │     │                                      │
│  │ frontend/       │     │                                      │
│  │                 │     │                                      │
│  │ Proxy /api/     │─────┼──► Backend :3000 (Internal)         │
│  │                 │     │                                      │
│  │ Proxy /webhook/ │─────┼──► n8n :5678 (Internal)             │
│  └─────────────────┘     │                                      │
│                           │                                      │
│  ┌──────────────────────────────────────────┐                  │
│  │ Backend PM2 :3000                        │                  │
│  │ (Internal only - not exposed)            │                  │
│  └──────────────────────────────────────────┘                  │
│                           │                                      │
│  ┌──────────────────────────────────────────┐                  │
│  │ Docker Network: sentiment-infra_app-network│                │
│  │                                            │                  │
│  │  ┌────────────────┐  ┌──────────────┐   │                  │
│  │  │ PostgreSQL     │  │ n8n :5678    │   │                  │
│  │  │ :5432          │  │ (Internal)   │   │                  │
│  │  └────────────────┘  └──────────────┘   │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key points:**
- **Frontend**: Public on port 80, serves static files, proxies API/webhook requests
- **Backend**: Internal port 3000, accessed via nginx proxy
- **n8n**: Internal port 5678, accessed via nginx proxy
- **PostgreSQL**: Internal port 5432, accessed by backend via Docker network
- **No CORS issues**: Frontend and API appear to be on the same origin

## Next Steps

After successful frontend deployment:

1. **Test Full Stack**: Verify that frontend → backend → database → n8n all work together
2. **Configure Domain** (optional): Set up a custom domain with Route 53 or your DNS provider
3. **Add HTTPS** (recommended): Use Let's Encrypt/Certbot to enable HTTPS
4. **Set up Monitoring**: Add CloudWatch or similar for logs and metrics
5. **Configure CI/CD**: Consider adding test, staging, and production environments

## Related Documentation

- Backend deployment: `../sentiment-backend/GITHUB_ACTIONS_SETUP.md`
- Infrastructure deployment: `../sentiment-infra/GITHUB_ACTIONS_SETUP.md`
- Frontend troubleshooting: `TROUBLESHOOTING.md`
- Environment variables: `_ENVIRONMENT_VARIABLES.md`
- Architecture: `_DEPLOYMENT_ARCHITECTURE.md`

## Support

If you encounter issues not covered in this guide:

1. Check workflow logs in GitHub Actions
2. Check `TROUBLESHOOTING.md` for common issues
3. SSH to EC2 and check service logs:
   - nginx: `sudo tail -f /var/log/nginx/error.log`
   - System: `sudo journalctl -xe`
4. Run health check script: `./scripts/health-check.sh`

## Security Notes

⚠️ **Important Security Considerations:**

1. **VITE_* Variables are Public**: Any variable starting with `VITE_` is embedded in the browser bundle and is visible to anyone. Never put secrets, API keys, or passwords in these variables.

2. **SSH Keys**: Keep your EC2 SSH private key secure. Never commit it to git. Store it only in GitHub Secrets.

3. **Port 80 is Public**: Your frontend is accessible to anyone on the internet. Ensure your backend implements proper authentication and authorization.

4. **HTTPS**: Consider adding HTTPS with Let's Encrypt for production use:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

5. **Security Groups**: Restrict SSH access to specific IP ranges if possible, instead of 0.0.0.0/0.
