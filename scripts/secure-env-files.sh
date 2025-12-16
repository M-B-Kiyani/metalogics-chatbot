#!/bin/bash

# Secure Environment Files Script for Linux/Mac
# Sets proper permissions on sensitive environment files

echo "=========================================="
echo "Environment Files Security Setup"
echo "=========================================="
echo ""

# List of sensitive files to secure
SENSITIVE_FILES=(
    "backend/.env"
    "backend/.env.production"
    "backend/.env.docker"
    ".env.production"
    ".env.local"
    "backend/google-credentials.json"
    "backend/metalogics-chatbot-0cbe5759fdfc.json"
    "backend/test-service-account.json"
)

SECURED_COUNT=0
NOT_FOUND_COUNT=0
ERROR_COUNT=0

for file in "${SENSITIVE_FILES[@]}"; do
    echo -n "Processing: $file"
    
    if [ -f "$file" ]; then
        if chmod 600 "$file" 2>/dev/null; then
            echo " ✅ SECURED"
            SECURED_COUNT=$((SECURED_COUNT + 1))
        else
            echo " ❌ ERROR"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    else
        echo " ⚠️  NOT FOUND"
        NOT_FOUND_COUNT=$((NOT_FOUND_COUNT + 1))
    fi
done

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Secured:   $SECURED_COUNT files"
echo "Not Found: $NOT_FOUND_COUNT files"
echo "Errors:    $ERROR_COUNT files"
echo ""

# Verify permissions
echo "=========================================="
echo "Verifying Permissions"
echo "=========================================="
echo ""

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        PERMS=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%A" "$file" 2>/dev/null)
        if [ "$PERMS" = "600" ]; then
            echo "✅ $file: $PERMS (secure)"
        else
            echo "⚠️  $file: $PERMS (should be 600)"
        fi
    fi
done

echo ""
echo "=========================================="
echo "Verifying .gitignore Protection"
echo "=========================================="

GITIGNORE_FILES=(
    ".gitignore"
    "backend/.gitignore"
)

PROTECTED_PATTERNS=(
    ".env"
    ".env.local"
    ".env.production"
    "google-credentials.json"
    "*.json"
)

for gitignore_file in "${GITIGNORE_FILES[@]}"; do
    if [ -f "$gitignore_file" ]; then
        echo ""
        echo "Checking: $gitignore_file"
        
        for pattern in "${PROTECTED_PATTERNS[@]}"; do
            if grep -q "$pattern" "$gitignore_file"; then
                echo "  ✅ $pattern is ignored"
            else
                echo "  ⚠️  $pattern is NOT ignored"
            fi
        done
    fi
done

echo ""
echo "=========================================="
echo "Security Recommendations"
echo "=========================================="
echo "1. ✅ File permissions set to 600 (owner read/write only)"
echo "2. ⚠️  Rotate all API keys and passwords regularly (every 90 days)"
echo "3. ⚠️  Never commit .env files to git"
echo "4. ⚠️  Use different credentials for dev/staging/production"
echo "5. ⚠️  Keep backups of production secrets (encrypted)"
echo ""
echo "For more information, see: docs/ENVIRONMENT_SECURITY.md"
echo ""

# Check if any env files are tracked by git
echo "=========================================="
echo "Checking Git Status"
echo "=========================================="

TRACKED_ENV_FILES=$(git ls-files 2>/dev/null | grep "\.env")

if [ -n "$TRACKED_ENV_FILES" ]; then
    echo "⚠️  WARNING: The following .env files are tracked by git:"
    echo "$TRACKED_ENV_FILES" | while read -r file; do
        echo "  - $file"
    done
    echo ""
    echo "To remove them from git (but keep locally):"
    echo "  git rm --cached <file>"
    echo "  git commit -m 'Remove sensitive files'"
else
    echo "✅ No .env files are tracked by git"
fi

echo ""
echo "Done! Environment files have been secured."
echo ""
