#!/bin/bash

# Frontend Deployment Script for sentiment-frontend
# This script deploys the built frontend to nginx

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "Deploying sentiment-frontend to nginx"
echo "========================================"

# Configuration
NGINX_ROOT="/var/www/sentiment-frontend"
NGINX_CONFIG_SOURCE="$PROJECT_ROOT/nginx.prod.conf"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/sentiment-frontend"
NGINX_CONFIG_LINK="/etc/nginx/sites-enabled/sentiment-frontend"
BUILD_SOURCE="/tmp/sentiment-frontend-dist"

# Check prerequisites
echo "Checking prerequisites..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ ERROR: nginx is not installed"
    echo "Please run setup-nginx.sh first or install nginx manually:"
    echo "  sudo apt-get update && sudo apt-get install -y nginx"
    exit 1
fi

# Check if build files exist
if [ ! -d "$BUILD_SOURCE" ]; then
    echo "❌ ERROR: Build directory not found at $BUILD_SOURCE"
    echo "This script expects the built files to be copied to /tmp/sentiment-frontend-dist/ first"
    exit 1
fi

# Check if build has index.html
if [ ! -f "$BUILD_SOURCE/index.html" ]; then
    echo "❌ ERROR: No index.html found in $BUILD_SOURCE"
    echo "The build output appears to be incomplete"
    exit 1
fi

# Check if nginx.prod.conf exists
if [ ! -f "$NGINX_CONFIG_SOURCE" ]; then
    echo "⚠️  WARNING: nginx.prod.conf not found at $NGINX_CONFIG_SOURCE"
    echo "Using inline default configuration"
    # The workflow will copy this file, so this shouldn't happen
fi

echo "✅ Prerequisites satisfied"

# Create nginx root directory if it doesn't exist
echo "Setting up nginx root directory..."
sudo mkdir -p "$NGINX_ROOT"

# Copy built files to nginx root
echo "Copying built files to $NGINX_ROOT..."
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r "$BUILD_SOURCE"/* "$NGINX_ROOT/"

# Set proper permissions
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

echo "✅ Built files deployed to $NGINX_ROOT"

# Copy nginx configuration
echo "Configuring nginx..."
if [ -f "$NGINX_CONFIG_SOURCE" ]; then
    sudo cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_DEST"
else
    # Fallback: create basic config if source doesn't exist
    echo "Creating default nginx configuration..."
    sudo bash -c "cat > $NGINX_CONFIG_DEST" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/sentiment-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy webhook requests to n8n
    location /webhook/ {
        proxy_pass http://localhost:5678/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback - serve index.html for all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /frontend-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
fi

# Enable site (create symlink if it doesn't exist)
if [ ! -L "$NGINX_CONFIG_LINK" ]; then
    echo "Enabling site configuration..."
    sudo ln -s "$NGINX_CONFIG_DEST" "$NGINX_CONFIG_LINK"
fi

# Remove default nginx site if it exists and conflicts
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "Testing nginx configuration..."
if ! sudo nginx -t; then
    echo "❌ ERROR: nginx configuration test failed"
    echo "Rolling back configuration changes..."
    sudo rm -f "$NGINX_CONFIG_LINK"
    exit 1
fi

echo "✅ nginx configuration valid"

# Reload nginx
echo "Reloading nginx..."
if sudo systemctl reload nginx; then
    echo "✅ nginx reloaded successfully"
else
    echo "⚠️  WARNING: Failed to reload nginx, attempting restart..."
    if sudo systemctl restart nginx; then
        echo "✅ nginx restarted successfully"
    else
        echo "❌ ERROR: Failed to restart nginx"
        sudo systemctl status nginx
        exit 1
    fi
fi

# Check nginx status
if ! sudo systemctl is-active --quiet nginx; then
    echo "❌ ERROR: nginx is not running"
    sudo systemctl status nginx
    exit 1
fi

echo "✅ nginx is running"

echo ""
echo "========================================"
echo "✅ Deployment completed successfully!"
echo "========================================"
echo ""
echo "Frontend is now available at:"
echo "  http://YOUR_EC2_IP/"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status nginx    # Check nginx status"
echo "  sudo nginx -t                  # Test nginx config"
echo "  sudo tail -f /var/log/nginx/access.log  # View access logs"
echo "  sudo tail -f /var/log/nginx/error.log   # View error logs"
echo ""
