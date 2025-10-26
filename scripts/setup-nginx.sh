#!/bin/bash

# Setup nginx for sentiment-frontend
# This script installs and configures nginx if not already installed

set -e  # Exit on error

echo "========================================"
echo "Setting up nginx for sentiment-frontend"
echo "========================================"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ ERROR: This script must be run with sudo"
    echo "Usage: sudo ./setup-nginx.sh"
    exit 1
fi

# Check if nginx is already installed
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | grep -oP '\d+\.\d+\.\d+')
    echo "✅ nginx is already installed (version: $NGINX_VERSION)"
else
    echo "Installing nginx..."
    apt-get update
    apt-get install -y nginx
    echo "✅ nginx installed successfully"
fi

# Enable nginx service
echo "Enabling nginx service..."
systemctl enable nginx

# Start nginx if not running
if ! systemctl is-active --quiet nginx; then
    echo "Starting nginx..."
    systemctl start nginx
    echo "✅ nginx started"
else
    echo "✅ nginx is already running"
fi

# Check nginx status
systemctl status nginx --no-pager

echo ""
echo "========================================"
echo "✅ nginx setup completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run deploy.sh to deploy the frontend"
echo "2. Verify deployment with health-check.sh"
echo ""
