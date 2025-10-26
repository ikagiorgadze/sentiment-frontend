# Troubleshooting Guide - sentiment-frontend

This guide covers common issues and solutions for deploying and running the sentiment-frontend.

## Table of Contents

1. [Deployment Issues](#deployment-issues)
2. [nginx Issues](#nginx-issues)
3. [Build Issues](#build-issues)
4. [Network and Proxy Issues](#network-and-proxy-issues)
5. [Health Check Failures](#health-check-failures)
6. [Performance Issues](#performance-issues)
7. [Debugging Commands](#debugging-commands)

---

## Deployment Issues

### Issue: GitHub Actions workflow fails at SSH connection

**Symptoms:**
- Workflow shows "Permission denied (publickey)"
- Or: Connection timeout
- Or: SSH hangs and workflow times out

**Causes:**
- EC2 security group not allowing SSH from GitHub Actions
- Incorrect SSH key in GitHub Secrets
- Wrong EC2_USER or EC2_HOST

**Solutions:**

1. **Verify security group allows SSH:**
   ```bash
   # On your local machine with AWS CLI
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   
   # Ensure there's a rule like:
   # Type: SSH, Port: 22, Source: 0.0.0.0/0
   ```

2. **Test SSH connection manually:**
   ```bash
   # Copy the SSH key from GitHub Secrets to a file
   cat > /tmp/test-key << 'EOF'
   -----BEGIN RSA PRIVATE KEY-----
   ... your key ...
   -----END RSA PRIVATE KEY-----
   EOF
   
   chmod 600 /tmp/test-key
   
   # Test connection
   ssh -i /tmp/test-key -o StrictHostKeyChecking=no ubuntu@YOUR_EC2_IP "echo 'Success'"
   
   # Clean up
   rm /tmp/test-key
   ```

3. **Verify public key is on EC2:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cat ~/.ssh/authorized_keys"
   # Should contain the public key matching your private key
   ```

4. **Regenerate SSH key pair if needed:**
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions-frontend -N ""
   ssh-copy-id -i ~/.ssh/github-actions-frontend.pub ubuntu@YOUR_EC2_IP
   # Copy private key content to GitHub Secrets
   cat ~/.ssh/github-actions-frontend
   ```

### Issue: File copy (rsync) fails

**Symptoms:**
- `rsync` command fails in GitHub Actions
- "No such file or directory" errors
- Permission denied during file copy

**Solutions:**

1. **Check /tmp directory permissions:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "ls -ld /tmp"
   # Should show: drwxrwxrwt (sticky bit set)
   ```

2. **Manually create directories if needed:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "mkdir -p /tmp/sentiment-frontend-dist /tmp/sentiment-frontend-deploy"
   ```

3. **Check disk space:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "df -h"
   # Ensure /tmp has sufficient space
   ```

### Issue: Deploy script fails

**Symptoms:**
- `deploy.sh` exits with error
- nginx not reloading
- Files not copied to /var/www/

**Solutions:**

1. **Check nginx is installed:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "which nginx"
   # If not found, install it:
   ssh ubuntu@YOUR_EC2_IP "sudo apt-get update && sudo apt-get install -y nginx"
   ```

2. **Check script permissions:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "ls -l /tmp/sentiment-frontend-deploy/*.sh"
   # Should show executable: -rwxr-xr-x
   ```

3. **Run deploy script manually to see full errors:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cd /tmp/sentiment-frontend-deploy && sudo ./deploy.sh"
   ```

4. **Check sudo permissions:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo -v"
   # Should not ask for password
   ```

---

## nginx Issues

### Issue: nginx configuration test fails

**Symptoms:**
- `nginx -t` shows "configuration file test failed"
- Error: "conflicting server name"
- Error: "unknown directive"

**Solutions:**

1. **Check nginx syntax:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo nginx -t"
   # Shows specific line with error
   ```

2. **Validate nginx.prod.conf locally:**
   ```bash
   # On your local machine
   nginx -t -c nginx.prod.conf
   ```

3. **Check for conflicting server blocks:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo nginx -T | grep 'server_name'"
   # Look for duplicate server_name directives
   ```

4. **Remove default site if it conflicts:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo rm -f /etc/nginx/sites-enabled/default"
   ssh ubuntu@YOUR_EC2_IP "sudo nginx -t && sudo systemctl reload nginx"
   ```

### Issue: nginx won't start or reload

**Symptoms:**
- `systemctl start nginx` fails
- `systemctl reload nginx` fails
- nginx shows "failed" status

**Solutions:**

1. **Check nginx status and logs:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo systemctl status nginx"
   ssh ubuntu@YOUR_EC2_IP "sudo journalctl -xeu nginx"
   ssh ubuntu@YOUR_EC2_IP "sudo tail -f /var/log/nginx/error.log"
   ```

2. **Check if port 80 is already in use:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo netstat -tlnp | grep :80"
   # Or
   ssh ubuntu@YOUR_EC2_IP "sudo ss -tlnp | grep :80"
   ```

3. **Kill process using port 80 if needed:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo lsof -ti:80 | xargs sudo kill -9"
   ```

4. **Restart nginx (not just reload):**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo systemctl stop nginx"
   ssh ubuntu@YOUR_EC2_IP "sudo systemctl start nginx"
   ssh ubuntu@YOUR_EC2_IP "sudo systemctl status nginx"
   ```

### Issue: 404 errors for all routes

**Symptoms:**
- Homepage loads but other routes return 404
- Refreshing a route returns nginx 404 page
- SPA routing not working

**Cause:**
- Missing `try_files` directive for SPA fallback

**Solution:**

Verify nginx.prod.conf has:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Then reload nginx:
```bash
ssh ubuntu@YOUR_EC2_IP "sudo nginx -t && sudo systemctl reload nginx"
```

### Issue: 502 Bad Gateway for /api or /webhook

**Symptoms:**
- Frontend loads but API calls return 502
- Webhook requests fail with 502
- nginx error log shows "Connection refused"

**Causes:**
- Backend not running on port 3000
- n8n not running on port 5678
- Firewall blocking internal connections

**Solutions:**

1. **Check backend is running:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "netstat -tlnp | grep :3000"
   # Or
   ssh ubuntu@YOUR_EC2_IP "pm2 status sentiment-backend"
   ```

2. **Check n8n is running:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "docker ps | grep n8n"
   ssh ubuntu@YOUR_EC2_IP "netstat -tlnp | grep :5678"
   ```

3. **Test direct connection to backend:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "curl -v http://localhost:3000/api/health"
   ```

4. **Test direct connection to n8n:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "curl -v http://localhost:5678/healthz"
   ```

5. **Check nginx error logs:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo tail -f /var/log/nginx/error.log"
   # Look for "connection refused" or "upstream" errors
   ```

---

## Build Issues

### Issue: npm ci fails in GitHub Actions

**Symptoms:**
- Workflow fails at "Install dependencies" step
- Error: "package-lock.json differs from package.json"
- Error: "Cannot find module"

**Solutions:**

1. **Regenerate package-lock.json:**
   ```bash
   rm package-lock.json
   npm install
   git add package-lock.json
   git commit -m "Regenerate package-lock.json"
   git push
   ```

2. **Clear npm cache (in Actions):**
   
   Add to workflow before `npm ci`:
   ```yaml
   - name: Clear npm cache
     run: npm cache clean --force
   ```

3. **Check Node version compatibility:**
   ```bash
   # Locally test with Node 20
   nvm use 20
   npm ci
   npm run build
   ```

### Issue: npm run build fails

**Symptoms:**
- Build fails with TypeScript errors
- Build fails with module not found
- Build fails with out of memory

**Solutions:**

1. **Check TypeScript errors:**
   ```bash
   npm run build
   # Fix any TypeScript type errors
   ```

2. **Increase Node memory (if out of memory):**
   
   Add to package.json:
   ```json
   {
     "scripts": {
       "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
     }
   }
   ```

3. **Check for missing dependencies:**
   ```bash
   npm run build 2>&1 | grep "Cannot find module"
   # Install any missing dependencies
   npm install <missing-module>
   ```

### Issue: Environment variables not working

**Symptoms:**
- `import.meta.env.VITE_*` is undefined
- API calls go to wrong URL
- Features that depend on env vars don't work

**Causes:**
- GitHub Secret not set
- Variable name doesn't start with `VITE_`
- Variable not included in workflow

**Solutions:**

1. **Verify GitHub Secrets are set:**
   - Go to repository Settings → Secrets and variables → Actions
   - Check that `VITE_API_BASE_URL` and other secrets exist

2. **Verify variable names start with VITE_:**
   ```typescript
   // ✅ Correct
   import.meta.env.VITE_API_BASE_URL
   
   // ❌ Wrong (not exposed by Vite)
   import.meta.env.API_BASE_URL
   ```

3. **Verify variables are in workflow:**
   
   Check `.github/workflows/deploy.yml`:
   ```yaml
   - name: Build application
     env:
       VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
       VITE_AI_ASSISTANT_URL: ${{ secrets.VITE_AI_ASSISTANT_URL }}
     run: npm run build
   ```

4. **Check variable in built bundle:**
   ```bash
   # After build, search bundle for the value
   grep -r "your-api-url" dist/assets/*.js
   ```

---

## Network and Proxy Issues

### Issue: CORS errors in browser

**Symptoms:**
- Browser console shows "CORS policy" errors
- API calls fail with CORS error
- Preflight (OPTIONS) requests fail

**Cause:**
- Not using nginx proxy (calling backend directly)
- Backend CORS configuration issue

**Solutions:**

1. **Verify frontend uses proxy path:**
   ```typescript
   // ✅ Correct - uses nginx proxy
   const response = await fetch('/api/health');
   
   // ❌ Wrong - direct backend call causes CORS
   const response = await fetch('http://localhost:3000/api/health');
   ```

2. **Check VITE_API_BASE_URL:**
   ```bash
   # Should be /api or not set (defaults to /api)
   echo $VITE_API_BASE_URL
   ```

3. **Verify nginx proxy configuration:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cat /etc/nginx/sites-available/sentiment-frontend | grep -A 10 'location /api'"
   ```

### Issue: API requests timeout or hang

**Symptoms:**
- API requests never complete
- Browser shows "pending" indefinitely
- No response from backend

**Solutions:**

1. **Check backend is accessible from nginx:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "curl -v http://localhost:3000/api/health"
   ```

2. **Check nginx access logs:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo tail -f /var/log/nginx/access.log"
   # Make API request from browser, verify it appears in logs
   ```

3. **Check backend logs:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "pm2 logs sentiment-backend --lines 50"
   ```

4. **Increase proxy timeout in nginx:**
   
   Edit nginx.prod.conf:
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000/api/;
       proxy_read_timeout 300s;  # Add this
       proxy_connect_timeout 300s;  # Add this
   }
   ```

### Issue: Static assets not loading

**Symptoms:**
- Blank page in browser
- Browser console shows 404 for JS/CSS files
- Assets have wrong path

**Solutions:**

1. **Check base path in vite.config.ts:**
   ```typescript
   export default defineConfig({
     base: '/',  // Should be '/' for root deployment
   });
   ```

2. **Check nginx root path:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "cat /etc/nginx/sites-available/sentiment-frontend | grep root"
   # Should be: root /var/www/sentiment-frontend;
   ```

3. **Check files exist:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "ls -la /var/www/sentiment-frontend"
   # Should show index.html and assets/ directory
   ```

4. **Check file permissions:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "ls -l /var/www/sentiment-frontend"
   # Should be readable by www-data (755)
   ```

---

## Health Check Failures

### Issue: Frontend health check fails

**Symptoms:**
- Health check script exits with errors
- `/frontend-health` endpoint returns 404 or error

**Solutions:**

1. **Test health endpoint manually:**
   ```bash
   curl http://YOUR_EC2_IP/frontend-health
   # Should return: healthy
   ```

2. **Check nginx configuration has health endpoint:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "grep -A 5 'frontend-health' /etc/nginx/sites-available/sentiment-frontend"
   ```

3. **Check nginx is running:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "sudo systemctl status nginx"
   ```

### Issue: API proxy health check fails

**Symptoms:**
- Health check shows API proxy not responding
- `/api/health` returns 502 or 404

**Cause:**
- Backend not deployed yet (expected on first frontend deployment)

**Solutions:**

1. **Verify backend is deployed and running:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "pm2 status"
   ssh ubuntu@YOUR_EC2_IP "curl http://localhost:3000/api/health"
   ```

2. **If backend not deployed, deploy it:**
   ```bash
   # See sentiment-backend deployment docs
   cd ../sentiment-backend
   # Follow GITHUB_ACTIONS_SETUP.md
   ```

3. **Test API proxy after backend is running:**
   ```bash
   curl http://YOUR_EC2_IP/api/health
   ```

---

## Performance Issues

### Issue: Slow page load times

**Symptoms:**
- Frontend takes long to load
- Large bundle size
- Many round trips for assets

**Solutions:**

1. **Enable gzip compression** (already in nginx.prod.conf):
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
   ```

2. **Check bundle size:**
   ```bash
   npm run build
   ls -lh dist/assets/*.js
   # Look for large bundle files
   ```

3. **Enable build optimizations:**
   ```bash
   # Check vite.config.ts has:
   build: {
     minify: 'terser',
     rollupOptions: {
       output: {
         manualChunks: {
           vendor: ['react', 'react-dom'],
         },
       },
     },
   }
   ```

4. **Add caching headers** (already in nginx.prod.conf):
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

### Issue: API requests are slow

**Symptoms:**
- API calls take several seconds
- Slow database queries
- High backend CPU usage

**Solutions:**

1. **Check backend performance:**
   ```bash
   ssh ubuntu@YOUR_EC2_IP "pm2 monit"
   # Check CPU and memory usage
   ```

2. **Check database connection:**
   ```bash
   # See backend troubleshooting guide
   cd ../sentiment-backend
   cat TROUBLESHOOTING.md
   ```

3. **Enable nginx caching for specific endpoints:**
   ```nginx
   # Add to nginx.prod.conf for cacheable endpoints
   location /api/public/ {
       proxy_pass http://localhost:3000/api/public/;
       proxy_cache my_cache;
       proxy_cache_valid 200 10m;
   }
   ```

---

## Debugging Commands

### Essential Debugging Commands

```bash
# SSH to EC2
ssh ubuntu@YOUR_EC2_IP

# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check what's listening on port 80
sudo netstat -tlnp | grep :80
sudo ss -tlnp | grep :80

# Check deployed files
ls -la /var/www/sentiment-frontend

# Check nginx configuration
cat /etc/nginx/sites-available/sentiment-frontend

# Test health endpoint
curl http://localhost/frontend-health

# Test API proxy
curl http://localhost/api/health

# Test webhook proxy
curl http://localhost/webhook/

# Check disk space
df -h

# Check system logs
sudo journalctl -xeu nginx
```

### Advanced Debugging

```bash
# Test nginx proxy with verbose output
curl -v -H "Host: YOUR_DOMAIN" http://localhost/api/health

# Check nginx worker processes
ps aux | grep nginx

# Check nginx configuration syntax without reloading
sudo nginx -T

# Monitor nginx in real-time
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Check SELinux (if enabled)
sudo getenforce
sudo setenforce 0  # Temporarily disable to test

# Test with different request methods
curl -X OPTIONS http://localhost/api/health -v

# Check DNS resolution
nslookup YOUR_EC2_IP

# Network connectivity test
ping -c 3 YOUR_EC2_IP
telnet YOUR_EC2_IP 80
```

---

## Getting Help

If your issue is not covered here:

1. **Check GitHub Actions logs**: Detailed output from each workflow step
2. **Check nginx logs**: `/var/log/nginx/error.log` and `/var/log/nginx/access.log`
3. **Run health check**: `./scripts/health-check.sh` for comprehensive diagnostics
4. **Check backend logs**: See `../sentiment-backend/TROUBLESHOOTING.md`
5. **Check infrastructure**: See `../sentiment-infra/TROUBLESHOOTING.md`

## Common Error Messages

| Error Message | Likely Cause | Solution |
|--------------|-------------|----------|
| `Permission denied (publickey)` | SSH key not on EC2 | Run `ssh-copy-id` |
| `Connection refused` | Service not running | Start service |
| `502 Bad Gateway` | Upstream not responding | Check backend/n8n status |
| `404 Not Found` | Route not configured | Check nginx config |
| `CORS policy` | Not using proxy | Use `/api` path |
| `nginx: [emerg] bind() to 0.0.0.0:80 failed` | Port already in use | Kill process on port 80 |
| `upstream timed out` | Backend too slow | Increase proxy timeout |

---

## Prevention Tips

- **Always test locally first**: Run `npm run build` locally before pushing
- **Use staging environment**: Test in non-production first
- **Monitor logs**: Set up log monitoring in production
- **Health checks**: Run health-check.sh after each deployment
- **Version control**: Keep nginx.prod.conf in git
- **Document changes**: Update this guide when you solve new issues
