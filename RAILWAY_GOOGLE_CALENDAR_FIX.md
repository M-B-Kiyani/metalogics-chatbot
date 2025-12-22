# Railway Google Calendar Configuration Fix

## Issue

The deployment is failing because `GOOGLE_SERVICE_ACCOUNT_KEY` contains invalid JSON.

## Quick Fix: Disable Google Calendar

In your Railway environment variables, set:

```
GOOGLE_CALENDAR_ENABLED=false
```

This will disable Google Calendar integration and allow the app to start successfully.

## Proper Fix: Configure Google Service Account Key

If you want to enable Google Calendar, follow these steps:

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

### Step 3: Set in Railway

1. Go to your Railway project
2. Click on your backend service
3. Go to Variables tab
4. Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the single-line JSON string
5. Make sure `GOOGLE_CALENDAR_ENABLED=true`
6. Set other required variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com`
   - `GOOGLE_CALENDAR_ID=your-calendar-id`
   - `GOOGLE_CALENDAR_TIMEZONE=your-timezone`

### Step 4: Redeploy

The app should now start successfully with Google Calendar enabled.

## Alternative: Use Base64 Encoding

If you're still having issues with JSON escaping, you can base64 encode the JSON:

1. Encode your JSON: `echo 'your-json-here' | base64`
2. Set `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=encoded-string`
3. Modify the config to decode base64 (requires code changes)

## Verification

After fixing, check the logs for:

- ✅ Configuration validation passed
- ✅ Google Calendar integration enabled
- ✅ Server started successfully
