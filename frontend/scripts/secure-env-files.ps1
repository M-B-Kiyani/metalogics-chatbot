# Secure Environment Files Script for Windows
# Sets proper permissions on sensitive environment files

#Requires -RunAsAdministrator

Write-Host "=========================================="
Write-Host "Environment Files Security Setup"
Write-Host "=========================================="
Write-Host ""

# List of sensitive files to secure
$sensitiveFiles = @(
    "backend\.env",
    "backend\.env.production",
    "backend\.env.docker",
    ".env.production",
    ".env.local",
    "backend\google-credentials.json",
    "backend\metalogics-chatbot-0cbe5759fdfc.json",
    "backend\test-service-account.json"
)

$securedCount = 0
$notFoundCount = 0
$errorCount = 0

foreach ($file in $sensitiveFiles) {
    Write-Host "Processing: $file" -NoNewline
    
    if (Test-Path $file) {
        try {
            # Get current ACL
            $acl = Get-Acl $file
            
            # Disable inheritance and remove existing rules
            $acl.SetAccessRuleProtection($true, $false)
            
            # Remove all existing access rules
            $acl.Access | ForEach-Object { $acl.RemoveAccessRule($_) | Out-Null }
            
            # Add rule for current user only (Full Control)
            $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                $env:USERNAME,
                "FullControl",
                "Allow"
            )
            $acl.AddAccessRule($rule)
            
            # Apply the new ACL
            Set-Acl $file $acl
            
            Write-Host " ✅ SECURED" -ForegroundColor Green
            $securedCount++
        }
        catch {
            Write-Host " ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host " ⚠️  NOT FOUND" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Summary"
Write-Host "=========================================="
Write-Host "Secured:   $securedCount files" -ForegroundColor Green
Write-Host "Not Found: $notFoundCount files" -ForegroundColor Yellow
Write-Host "Errors:    $errorCount files" -ForegroundColor Red
Write-Host ""

# Verify .gitignore
Write-Host "=========================================="
Write-Host "Verifying .gitignore Protection"
Write-Host "=========================================="

$gitignoreFiles = @(
    ".gitignore",
    "backend\.gitignore"
)

$protectedPatterns = @(
    ".env",
    ".env.local",
    ".env.production",
    "google-credentials.json",
    "*.json"
)

foreach ($gitignoreFile in $gitignoreFiles) {
    if (Test-Path $gitignoreFile) {
        Write-Host "`nChecking: $gitignoreFile"
        $content = Get-Content $gitignoreFile -Raw
        
        foreach ($pattern in $protectedPatterns) {
            if ($content -match [regex]::Escape($pattern)) {
                Write-Host "  ✅ $pattern is ignored" -ForegroundColor Green
            }
            else {
                Write-Host "  ⚠️  $pattern is NOT ignored" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Security Recommendations"
Write-Host "=========================================="
Write-Host "1. ✅ File permissions set to owner-only access"
Write-Host "2. ⚠️  Rotate all API keys and passwords regularly (every 90 days)"
Write-Host "3. ⚠️  Never commit .env files to git"
Write-Host "4. ⚠️  Use different credentials for dev/staging/production"
Write-Host "5. ⚠️  Keep backups of production secrets (encrypted)"
Write-Host ""
Write-Host "For more information, see: docs/ENVIRONMENT_SECURITY.md"
Write-Host ""

# Check if any env files are tracked by git
Write-Host "=========================================="
Write-Host "Checking Git Status"
Write-Host "=========================================="

$trackedEnvFiles = git ls-files | Select-String -Pattern "\.env"

if ($trackedEnvFiles) {
    Write-Host "⚠️  WARNING: The following .env files are tracked by git:" -ForegroundColor Red
    $trackedEnvFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "To remove them from git (but keep locally):" -ForegroundColor Yellow
    Write-Host "  git rm --cached <file>" -ForegroundColor Yellow
    Write-Host "  git commit -m 'Remove sensitive files'" -ForegroundColor Yellow
}
else {
    Write-Host "✅ No .env files are tracked by git" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! Environment files have been secured." -ForegroundColor Green
Write-Host ""
