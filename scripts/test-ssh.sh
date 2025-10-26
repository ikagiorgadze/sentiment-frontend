#!/bin/bash

# Test SSH Connection Script for sentiment-frontend deployment
# This script tests if SSH connection to EC2 works correctly

set -e

echo "=========================================="
echo "Testing SSH Connection to EC2"
echo "=========================================="
echo ""

# Check if required variables are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./test-ssh.sh <EC2_USER> <EC2_HOST>"
    echo ""
    echo "Example:"
    echo "  ./test-ssh.sh ubuntu 54.123.45.67"
    echo ""
    exit 1
fi

EC2_USER="$1"
EC2_HOST="$2"

echo "Testing connection to: $EC2_USER@$EC2_HOST"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic SSH connectivity..."
if ssh -o ConnectTimeout=10 \
       -o StrictHostKeyChecking=no \
       -o UserKnownHostsFile=/dev/null \
       -o BatchMode=yes \
       "$EC2_USER@$EC2_HOST" \
       "echo 'SSH connection successful'" 2>&1; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    echo ""
    echo "Possible issues:"
    echo "1. EC2 security group doesn't allow SSH (port 22) from your IP"
    echo "2. Wrong username (try 'ubuntu' or 'ec2-user')"
    echo "3. Wrong host IP"
    echo "4. SSH key not authorized on EC2"
    echo ""
    exit 1
fi

echo ""

# Test 2: Check sudo access
echo "Test 2: Checking sudo access..."
if ssh -o ConnectTimeout=10 \
       -o StrictHostKeyChecking=no \
       -o UserKnownHostsFile=/dev/null \
       "$EC2_USER@$EC2_HOST" \
       "sudo -n true" 2>&1; then
    echo "✅ Sudo access works (no password required)"
else
    echo "⚠️  Sudo requires password or doesn't work"
    echo "   This may cause deployment issues"
fi

echo ""

# Test 3: Check if nginx is installed
echo "Test 3: Checking if nginx is installed..."
if ssh -o ConnectTimeout=10 \
       -o StrictHostKeyChecking=no \
       -o UserKnownHostsFile=/dev/null \
       "$EC2_USER@$EC2_HOST" \
       "which nginx" 2>&1 | grep -q nginx; then
    NGINX_VERSION=$(ssh -o ConnectTimeout=10 \
                        -o StrictHostKeyChecking=no \
                        -o UserKnownHostsFile=/dev/null \
                        "$EC2_USER@$EC2_HOST" \
                        "nginx -v 2>&1 | grep -oP '\d+\.\d+\.\d+'" || echo "unknown")
    echo "✅ nginx is installed (version: $NGINX_VERSION)"
else
    echo "❌ nginx is NOT installed"
    echo "   Install it with: sudo apt-get update && sudo apt-get install -y nginx"
fi

echo ""

# Test 4: Check if port 80 is free or nginx is using it
echo "Test 4: Checking port 80 status..."
PORT_80_STATUS=$(ssh -o ConnectTimeout=10 \
                     -o StrictHostKeyChecking=no \
                     -o UserKnownHostsFile=/dev/null \
                     "$EC2_USER@$EC2_HOST" \
                     "sudo netstat -tlnp 2>/dev/null | grep :80 || sudo ss -tlnp 2>/dev/null | grep :80 || echo 'NOT_IN_USE'" 2>&1)

if echo "$PORT_80_STATUS" | grep -q "NOT_IN_USE"; then
    echo "⚠️  Port 80 is not in use (nginx not running yet)"
elif echo "$PORT_80_STATUS" | grep -q "nginx"; then
    echo "✅ Port 80 is in use by nginx"
else
    echo "⚠️  Port 80 is in use by another process:"
    echo "   $PORT_80_STATUS"
fi

echo ""

# Test 5: Check directory permissions
echo "Test 5: Checking /tmp directory..."
if ssh -o ConnectTimeout=10 \
       -o StrictHostKeyChecking=no \
       -o UserKnownHostsFile=/dev/null \
       "$EC2_USER@$EC2_HOST" \
       "test -w /tmp && echo 'writable'" 2>&1 | grep -q "writable"; then
    echo "✅ /tmp directory is writable"
else
    echo "❌ /tmp directory is not writable"
fi

echo ""

# Test 6: Check if backend is running
echo "Test 6: Checking if backend is running..."
if ssh -o ConnectTimeout=10 \
       -o StrictHostKeyChecking=no \
       -o UserKnownHostsFile=/dev/null \
       "$EC2_USER@$EC2_HOST" \
       "netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000" 2>&1 | grep -q "3000"; then
    echo "✅ Backend is running on port 3000"
else
    echo "⚠️  Backend is NOT running on port 3000"
    echo "   Deploy backend first for full functionality"
fi

echo ""

# Test 7: Check if Docker containers are running
echo "Test 7: Checking Docker containers..."
DOCKER_STATUS=$(ssh -o ConnectTimeout=10 \
                    -o StrictHostKeyChecking=no \
                    -o UserKnownHostsFile=/dev/null \
                    "$EC2_USER@$EC2_HOST" \
                    "docker ps --format '{{.Names}}' 2>/dev/null | grep sentiment-infra || echo 'NONE'" 2>&1)

if echo "$DOCKER_STATUS" | grep -q "sentiment-infra"; then
    echo "✅ Docker containers are running:"
    echo "$DOCKER_STATUS" | while read -r line; do
        echo "   - $line"
    done
else
    echo "⚠️  No sentiment-infra Docker containers running"
    echo "   Deploy infrastructure first for full functionality"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "✅ SSH connection is working"
echo "   You can proceed with GitHub Actions deployment"
echo ""
echo "Next steps:"
echo "1. Add GitHub Secrets in your repository:"
echo "   - EC2_HOST: $EC2_HOST"
echo "   - EC2_USER: $EC2_USER"
echo "   - EC2_SSH_KEY: (your private SSH key)"
echo ""
echo "2. Push to main branch or manually trigger the workflow"
echo ""
echo "3. Monitor deployment in GitHub Actions tab"
echo ""
