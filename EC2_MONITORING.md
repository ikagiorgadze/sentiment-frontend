# EC2 Process Monitoring Guide

Quick reference for checking what's running on your EC2 instance.

## SSH to EC2

```bash
ssh ubuntu@YOUR_EC2_IP
# OR
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP
```

---

## Quick Status Check (All Services)

Run this comprehensive check:

```bash
#!/bin/bash
echo "=========================================="
echo "EC2 Instance Health Check"
echo "=========================================="
echo ""

echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not running or not installed"
echo ""

echo "=== PM2 Processes ==="
pm2 status 2>/dev/null || echo "PM2 not running or not installed"
echo ""

echo "=== Listening Ports ==="
echo "Port 80 (nginx):    $(sudo ss -tlnp | grep ':80 ' | awk '{print $4, $6}')"
echo "Port 3000 (backend): $(sudo ss -tlnp | grep ':3000 ' | awk '{print $4, $6}')"
echo "Port 5432 (postgres): $(sudo ss -tlnp | grep ':5432 ' | awk '{print $4, $6}')"
echo "Port 5678 (n8n):     $(sudo ss -tlnp | grep ':5678 ' | awk '{print $4, $6}')"
echo "Port 8080 (adminer): $(sudo ss -tlnp | grep ':8080 ' | awk '{print $4, $6}')"
echo ""

echo "=== System Services ==="
echo -n "nginx:      " && systemctl is-active nginx 2>/dev/null || echo "not installed"
echo -n "docker:     " && systemctl is-active docker 2>/dev/null || echo "not installed"
echo ""

echo "=== Quick Health Checks ==="
echo -n "Frontend (port 80):        "
curl -sf http://localhost/frontend-health >/dev/null 2>&1 && echo "✅ healthy" || echo "❌ not responding"

echo -n "Backend (port 3000):       "
curl -sf http://localhost:3000/health >/dev/null 2>&1 && echo "✅ healthy" || echo "❌ not responding"

echo -n "PostgreSQL (port 5432):    "
nc -zv localhost 5432 >/dev/null 2>&1 && echo "✅ listening" || echo "❌ not listening"

echo -n "n8n (port 5678):           "
curl -sf http://localhost:5678/healthz >/dev/null 2>&1 && echo "✅ healthy" || echo "❌ not responding"

echo ""
echo "=========================================="
```

Save this as `check-all.sh`, then run:
```bash
chmod +x check-all.sh
./check-all.sh
```

---

## Individual Service Checks

### 1. Check Backend (PM2)

```bash
# Status of all PM2 processes
pm2 status

# Detailed info about backend
pm2 describe sentiment-backend

# View logs
pm2 logs sentiment-backend --lines 50

# Real-time logs
pm2 logs sentiment-backend

# Check if backend is listening
sudo netstat -tlnp | grep :3000
# OR
sudo ss -tlnp | grep :3000

# Test backend health
curl http://localhost:3000/health
```

**Expected output when running:**
```
┌─────┬──────────────────────┬─────────┬─────────┬──────┐
│ id  │ name                 │ status  │ ↺       │ cpu  │
├─────┼──────────────────────┼─────────┼─────────┼──────┤
│ 0   │ sentiment-backend    │ online  │ 0       │ 1%   │
└─────┴──────────────────────┴─────────┴─────────┴──────┘
```

### 2. Check Frontend (nginx)

```bash
# nginx status
sudo systemctl status nginx

# Check if nginx is listening on port 80
sudo netstat -tlnp | grep :80
# OR
sudo ss -tlnp | grep :80

# Test frontend health
curl http://localhost/frontend-health

# Test frontend homepage
curl -I http://localhost/

# Check frontend files
ls -la /var/www/sentiment-frontend

# Check nginx configuration
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Expected output when running:**
```
● nginx.service - A high performance web server
   Active: active (running)
```

### 3. Check Infrastructure (Docker)

```bash
# List all containers
docker ps

# Detailed view
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check specific containers
docker ps | grep postgres
docker ps | grep n8n
docker ps | grep adminer

# Check container logs
docker logs sentiment-infra-postgres-1
docker logs sentiment-infra-n8n-1
docker logs sentiment-infra-adminer-1

# Check container health
docker inspect sentiment-infra-postgres-1 | grep -A 10 Health
```

**Expected output when running:**
```
CONTAINER ID   NAMES                         STATUS
abc123         sentiment-infra-postgres-1    Up 2 hours
def456         sentiment-infra-n8n-1         Up 2 hours
ghi789         sentiment-infra-adminer-1     Up 2 hours
```

### 4. Check Database Connection

```bash
# Test port is open
nc -zv localhost 5432

# Connect with psql (if installed)
PGPASSWORD='your_password' psql -h localhost -p 5432 -U appuser -d facebook_analysis -c "SELECT version();"

# Test from backend directory
cd ~/sentiment-backend
npm run test:db

# Check Docker container
docker exec sentiment-infra-postgres-1 psql -U appuser -d facebook_analysis -c "SELECT count(*) FROM pg_stat_activity;"
```

### 5. Check n8n

```bash
# Test port is open
nc -zv localhost 5678

# Test health endpoint
curl http://localhost:5678/healthz

# Access n8n UI (if security group allows)
# Open browser: http://YOUR_EC2_IP:5678

# Check n8n logs
docker logs -f sentiment-infra-n8n-1
```

---

## Check All Listening Ports

```bash
# All listening TCP ports
sudo netstat -tlnp

# OR with ss (newer)
sudo ss -tlnp

# Filter for specific ports
sudo ss -tlnp | grep -E ":(80|3000|5432|5678|8080)"

# Show what's using each port
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :5678
```

**Expected output:**
```
LISTEN    0.0.0.0:80          nginx
LISTEN    0.0.0.0:3000        node (PM2)
LISTEN    0.0.0.0:5432        docker-proxy
LISTEN    0.0.0.0:5678        docker-proxy
LISTEN    0.0.0.0:8080        docker-proxy
```

---

## Check System Resources

```bash
# CPU and memory usage
top
# OR
htop

# Disk usage
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit

# Docker stats
docker stats
```

---

## Process Management Commands

### Start/Stop Services

```bash
# Backend (PM2)
pm2 start sentiment-backend
pm2 stop sentiment-backend
pm2 restart sentiment-backend
pm2 delete sentiment-backend

# Frontend (nginx)
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx  # Reload config without downtime

# Infrastructure (Docker)
cd ~/sentiment-infra
docker compose -f docker-compose.production.yml up -d    # Start
docker compose -f docker-compose.production.yml down     # Stop
docker compose -f docker-compose.production.yml restart  # Restart
```

---

## Troubleshooting Common Issues

### Backend Not Running

```bash
# Check if it crashed
pm2 logs sentiment-backend --lines 100

# Check .env file
cd ~/sentiment-backend
cat .env | grep -E "DATABASE_HOST|DATABASE_PORT"
# Should show: DATABASE_HOST=localhost

# Check database connection
nc -zv localhost 5432

# Restart backend
pm2 restart sentiment-backend
pm2 logs sentiment-backend
```

### Frontend Not Accessible

```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Test nginx config
sudo nginx -t

# Check if files exist
ls -la /var/www/sentiment-frontend/

# Restart nginx
sudo systemctl restart nginx
```

### Database Not Accessible

```bash
# Check PostgreSQL container
docker ps | grep postgres

# Check logs
docker logs sentiment-infra-postgres-1 --tail 50

# Check port
nc -zv localhost 5432

# Restart container
cd ~/sentiment-infra
docker compose -f docker-compose.production.yml restart postgres
```

### Port Already in Use

```bash
# Find what's using a port
sudo lsof -ti:3000
sudo lsof -ti:80

# Kill process on a port
sudo kill $(sudo lsof -ti:3000)
# OR force kill
sudo kill -9 $(sudo lsof -ti:3000)
```

---

## Automated Health Check

Create a cron job to check services periodically:

```bash
# Edit crontab
crontab -e

# Add this line to check every 5 minutes
*/5 * * * * /home/ubuntu/check-all.sh > /home/ubuntu/health-check.log 2>&1
```

---

## Remote Checks (From Your Local Machine)

```bash
# Check frontend from local
curl http://YOUR_EC2_IP/
curl http://YOUR_EC2_IP/frontend-health

# Check backend from local (if port 3000 is open)
curl http://YOUR_EC2_IP:3000/health

# Check via SSH one-liner
ssh ubuntu@YOUR_EC2_IP "pm2 status && docker ps && sudo ss -tlnp | grep -E ':(80|3000|5432|5678)'"
```

---

## Summary Commands (Copy-Paste Ready)

```bash
# Quick check everything
ssh ubuntu@YOUR_EC2_IP '
echo "=== PM2 ===" && pm2 status && \
echo -e "\n=== Docker ===" && docker ps && \
echo -e "\n=== Ports ===" && sudo ss -tlnp | grep -E ":(80|3000|5432|5678)" && \
echo -e "\n=== Health ===" && \
curl -sf http://localhost/frontend-health && echo " Frontend: OK" && \
curl -sf http://localhost:3000/health && echo " Backend: OK"
'
```

---

## Related Documentation

- Backend deployment: `../sentiment-backend/GITHUB_ACTIONS_SETUP.md`
- Frontend deployment: `GITHUB_ACTIONS_SETUP.md`
- Infrastructure: `../sentiment-infra/GITHUB_ACTIONS_SETUP.md`
- Troubleshooting: `TROUBLESHOOTING.md`
