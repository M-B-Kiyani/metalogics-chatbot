#!/bin/bash

# SSL Certificate Setup Script for bilal.metalogics.io
# This script sets up Let's Encrypt SSL certificates

set -e

DOMAIN="bilal.metalogics.io"
EMAIL="bilal@metalogics.io"  # Change this to your email

echo "=========================================="
echo "SSL Certificate Setup for $DOMAIN"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Certbot
echo "Installing Certbot..."
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y certbot
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y certbot
else
    echo "Unsupported package manager. Please install certbot manually."
    exit 1
fi

# Stop any service using port 80
echo "Checking for services on port 80..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 80 is in use. Stopping services..."
    systemctl stop nginx 2>/dev/null || true
    systemctl stop apache2 2>/dev/null || true
fi

# Generate certificate
echo "Generating SSL certificate for $DOMAIN..."
certbot certonly --standalone \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --preferred-challenges http

# Set up auto-renewal
echo "Setting up auto-renewal..."
certbot renew --dry-run

# Create renewal cron job
echo "Creating cron job for certificate renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo ""
echo "=========================================="
echo "SSL Certificate Setup Complete!"
echo "=========================================="
echo ""
echo "Certificate files location:"
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "Next steps:"
echo "1. Configure your web server (nginx/apache) to use these certificates"
echo "2. Update your application URLs to use https://"
echo "3. Test the certificate: https://www.ssllabs.com/ssltest/"
echo ""
