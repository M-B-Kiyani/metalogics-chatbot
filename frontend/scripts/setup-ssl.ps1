# SSL Certificate Setup Script for Windows (bilal.metalogics.io)
# This script provides instructions for setting up SSL on Windows

$Domain = "bilal.metalogics.io"

Write-Host "=========================================="
Write-Host "SSL Certificate Setup for $Domain"
Write-Host "=========================================="
Write-Host ""

Write-Host "For Windows servers, you have several options:"
Write-Host ""

Write-Host "Option 1: Use Win-ACME (Recommended for Windows/IIS)"
Write-Host "----------------------------------------"
Write-Host "1. Download Win-ACME from: https://www.win-acme.com/"
Write-Host "2. Extract and run wacs.exe"
Write-Host "3. Follow the wizard to create a certificate for $Domain"
Write-Host "4. Win-ACME will automatically configure IIS and set up renewal"
Write-Host ""

Write-Host "Option 2: Use Certify The Web (GUI Tool)"
Write-Host "----------------------------------------"
Write-Host "1. Download from: https://certifytheweb.com/"
Write-Host "2. Install and launch the application"
Write-Host "3. Click 'New Certificate'"
Write-Host "4. Enter domain: $Domain"
Write-Host "5. Click 'Request Certificate'"
Write-Host ""

Write-Host "Option 3: Use Cloud Provider SSL"
Write-Host "----------------------------------------"
Write-Host "If hosting on:"
Write-Host "  - Azure: Use Azure App Service SSL"
Write-Host "  - AWS: Use AWS Certificate Manager"
Write-Host "  - Cloudflare: Use Cloudflare SSL (Free)"
Write-Host ""

Write-Host "Option 4: Manual Certificate (Development/Testing)"
Write-Host "----------------------------------------"
Write-Host "For local testing only, you can create a self-signed certificate:"
Write-Host ""
Write-Host "Run this PowerShell command:"
Write-Host 'New-SelfSignedCertificate -DnsName "bilal.metalogics.io" -CertStoreLocation "cert:\LocalMachine\My"'
Write-Host ""
Write-Host "Note: Self-signed certificates will show browser warnings!"
Write-Host ""

Write-Host "=========================================="
Write-Host "After obtaining your certificate:"
Write-Host "=========================================="
Write-Host "1. Update backend/.env.production with https URLs"
Write-Host "2. Update .env.production with https URLs"
Write-Host "3. Configure your web server to use the certificate"
Write-Host "4. Test at: https://www.ssllabs.com/ssltest/"
Write-Host ""

Read-Host "Press Enter to exit"
