#!/bin/bash

# Health Check Script for sentiment-frontend
# Verifies that the frontend is deployed and accessible

set -e  # Exit on error

echo "========================================"
echo "Health Check: sentiment-frontend"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        ((ERRORS++))
    fi
}

print_warning() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

# Check 1: nginx service status
echo "Checking nginx service..."
if systemctl is-active --quiet nginx; then
    print_status 0 "nginx service is running"
else
    print_status 1 "nginx service is NOT running"
    systemctl status nginx --no-pager || true
fi

# Check 2: nginx is listening on port 80
echo ""
echo "Checking nginx port 80..."
if sudo netstat -tlnp 2>/dev/null | grep -q ':80.*nginx' || sudo ss -tlnp 2>/dev/null | grep -q ':80.*nginx'; then
    print_status 0 "nginx is listening on port 80"
else
    print_status 1 "nginx is NOT listening on port 80"
fi

# Check 3: Frontend files exist
echo ""
echo "Checking frontend files..."
if [ -f "/var/www/sentiment-frontend/index.html" ]; then
    print_status 0 "Frontend files deployed to /var/www/sentiment-frontend"
    FILE_COUNT=$(find /var/www/sentiment-frontend -type f | wc -l)
    echo "   Found $FILE_COUNT files in deployment directory"
else
    print_status 1 "Frontend files NOT found at /var/www/sentiment-frontend"
fi

# Check 4: nginx configuration
echo ""
echo "Checking nginx configuration..."
if [ -f "/etc/nginx/sites-available/sentiment-frontend" ]; then
    print_status 0 "nginx configuration exists"
    if [ -L "/etc/nginx/sites-enabled/sentiment-frontend" ]; then
        print_status 0 "nginx site is enabled"
    else
        print_status 1 "nginx site is NOT enabled"
    fi
else
    print_status 1 "nginx configuration NOT found"
fi

# Check 5: nginx configuration syntax
echo ""
echo "Validating nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    print_status 0 "nginx configuration is valid"
else
    print_status 1 "nginx configuration has errors"
    sudo nginx -t 2>&1 || true
fi

# Check 6: Frontend health endpoint
echo ""
echo "Testing frontend health endpoint..."
if curl -sf http://localhost/frontend-health > /dev/null 2>&1; then
    print_status 0 "Frontend health endpoint responding"
    RESPONSE=$(curl -s http://localhost/frontend-health)
    echo "   Response: $RESPONSE"
else
    print_status 1 "Frontend health endpoint NOT responding"
fi

# Check 7: Frontend homepage
echo ""
echo "Testing frontend homepage..."
if curl -sf http://localhost/ > /dev/null 2>&1; then
    print_status 0 "Frontend homepage accessible"
    CONTENT=$(curl -s http://localhost/ | head -c 100)
    echo "   Content preview: ${CONTENT:0:80}..."
else
    print_status 1 "Frontend homepage NOT accessible"
fi

# Check 8: API proxy to backend
echo ""
echo "Testing API proxy (requires backend running)..."
if curl -sf http://localhost/health > /dev/null 2>&1; then
    print_status 0 "API proxy to backend working"
    API_RESPONSE=$(curl -s http://localhost/health)
    echo "   Backend response: $API_RESPONSE"
else
    print_warning "API proxy not responding (backend may not be running yet)"
    echo "   This is expected if the backend hasn't been deployed yet"
fi

# Check 9: Webhook proxy to n8n
echo ""
echo "Testing webhook proxy (requires n8n running)..."
if curl -sf http://localhost/webhook/ > /dev/null 2>&1; then
    print_status 0 "Webhook proxy to n8n working"
else
    print_warning "Webhook proxy not responding (n8n may not be accessible)"
    echo "   This is expected if n8n hasn't been configured yet"
fi

# Check 10: File permissions
echo ""
echo "Checking file permissions..."
if [ -d "/var/www/sentiment-frontend" ]; then
    OWNER=$(stat -c '%U:%G' /var/www/sentiment-frontend)
    if [ "$OWNER" = "www-data:www-data" ]; then
        print_status 0 "File permissions correct (www-data:www-data)"
    else
        print_warning "File permissions may be incorrect: $OWNER (expected www-data:www-data)"
    fi
fi

# Summary
echo ""
echo "========================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical health checks passed!"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warnings (non-critical)"
    fi
    echo "========================================"
    echo ""
    echo "Frontend is healthy and accessible"
    exit 0
else
    echo "❌ $ERRORS critical health check(s) failed"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warnings"
    fi
    echo "========================================"
    echo ""
    echo "Please check the logs for more details:"
    echo "  sudo tail -f /var/log/nginx/error.log"
    echo "  sudo systemctl status nginx"
    exit 1
fi
