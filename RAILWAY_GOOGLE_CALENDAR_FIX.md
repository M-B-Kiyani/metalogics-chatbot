# Railway Google Calendar Configuration Fix

## Issue

The deployment is failing because `GOOGLE_SERVICE_ACCOUNT_KEY` contains invalid JSON.

## Root Cause

The Google Service Account Key JSON is not properly formatted for Railway environment variables. Railway requires the JSON to be:

1. On a single line
2. Properly escaped
3. Valid JSON format

## Solution: Fix the Google Service Account Key

### Step 1: Get Your Service Account Key

1. Go to Google Cloud Console
2. Navigate to IAM & Admin > Service Accounts
3. Find your service account
4. Click "Keys" tab
5. Click "Add Key" > "Create New Key"
6. Choose JSON format
7. Download the key file

### Step 2: Format for Railway

The JSON key needs to be properly formatted as a single line string:

**Original JSON (multi-line):**

```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

**Railway Format (single line, escaped):**

```
{"type":"service_account","project_id":"your-project","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n","client_email":"service-account@project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```

### Step 3: Convert JSON to Single Line

You can use online tools or command line:

**Using jq (recommended):**

```bash
cat your-service-account-key.json | jq -c .
```

**Using Node.js:**

```javascript
const fs = require("fs");
const key = JSON.parse(
  fs.readFileSync("your-service-account-key.json", "utf8")
);
console.log(JSON.stringify(key));
```

**Using Python:**

```python
import json
with open('your-service-account-key.json', 'r') as f:
    key = json.load(f)
print(json.dumps(key, separators=(',', ':')))
```

### Step 4: Set in Railway

1. Go to your Railway project
2. Click on your backend service
3. Go to Variables tab
4. Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the single-line JSON string
5. Make sure these variables are also set:
   - `GOOGLE_CALENDAR_ENABLED=true`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com`
   - `GOOGLE_CALENDAR_ID=your-calendar-id`
   - `GOOGLE_CALENDAR_TIMEZONE=your-timezone`

### Step 5: Redeploy

The app should now start successfully with Google Calendar enabled.

## Common Issues

### Issue: Extra characters in JSON

**Problem:** Copy-paste added extra characters
**Solution:** Validate JSON with `jq . your-file.json` or online JSON validator

### Issue: Newlines not escaped

**Problem:** `\n` in private key not properly escaped as `\\n`
**Solution:** Use proper JSON stringification tools

### Issue: Quotes not escaped

**Problem:** Unescaped quotes in JSON values
**Solution:** Use `JSON.stringify()` which handles escaping automatically

## Verification

After fixing, check the logs for:

- ✅ Configuration validation passed
- ✅ Google Calendar integration enabled
- ✅ Server started successfully

## Alternative: Disable Google Calendar Temporarily

If you need to deploy quickly, you can temporarily disable Google Calendar:

```
GOOGLE_CALENDAR_ENABLED=false
```

This will allow the app to start while you fix the JSON formatting.
