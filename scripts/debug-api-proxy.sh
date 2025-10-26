#!/bin/bash

# Debug API Proxy Issue
# Run this on EC2 to diagnose why /api/health is not responding

echo "=========================================="
echo "API Proxy Debugging"
echo "=========================================="
echo ""

# 1. Check if backend is running
echo "=== Backend Status ==="
echo -n "PM2 Status: "
pm2 describe sentiment-backend >/dev/null 2>&1 && echo "Running" || echo "NOT Running"

if pm2 describe sentiment-backend >/dev/null 2>&1; then
    pm2 status sentiment-backend
fi

echo ""

# 2. Check if backend port 3000 is listening
echo "=== Backend Port 3000 ==="
if sudo ss -tlnp | grep -q :3000; then
    echo "✅ Backend is listening on port 3000"
    sudo ss -tlnp | grep :3000
else
    echo "❌ Backend is NOT listening on port 3000"
fi

echo ""

# 3. Test backend directly
echo "=== Direct Backend Test ==="
echo "Testing: curl http://localhost:3000/health"
if curl -sf http://localhost:3000/health 2>/dev/null; then
    echo ""
    echo "✅ Backend responds directly"
else
    echo "❌ Backend does NOT respond directly"
fi

echo ""

# 4. Test backend API endpoint
echo "=== Backend API Health Endpoint ==="
echo "Testing: curl http://localhost:3000/api/health"
if curl -sf http://localhost:3000/api/health 2>/dev/null; then
    echo ""
    echo "✅ Backend /api/health responds"
else
    echo "❌ Backend /api/health does NOT respond"
fi

echo ""

# 5. Check nginx proxy configuration
echo "=== nginx Proxy Configuration ==="
echo "Checking nginx config for /api/ location..."
if grep -A 10 "location /api/" /etc/nginx/sites-available/sentiment-frontend 2>/dev/null; then
    echo ""
    echo "✅ nginx config has /api/ proxy"
else
    echo "❌ nginx config missing /api/ proxy"
fi

echo ""

# 6. Test through nginx proxy
echo "=== Test Through nginx Proxy ==="
echo "Testing: curl http://localhost/api/health"
if curl -sf http://localhost/api/health 2>/dev/null; then
    echo ""
    echo "✅ nginx proxy to backend works"
else
    echo "❌ nginx proxy to backend does NOT work"
    echo ""
    echo "Checking nginx error logs:"
    sudo tail -n 20 /var/log/nginx/error.log
fi

echo ""

# 7. Check backend logs
echo "=== Backend Recent Logs ==="
echo "Last 10 lines:"
pm2 logs sentiment-backend --lines 10 --nostream 2>/dev/null || echo "Cannot read PM2 logs"

echo ""

# 8. Test with verbose curl
echo "=== Verbose Test ==="
echo "Testing with full output:"
curl -v http://localhost/api/health 2>&1 | head -n 30

echo ""
echo "=========================================="
echo "Debugging Complete"
echo "=========================================="
