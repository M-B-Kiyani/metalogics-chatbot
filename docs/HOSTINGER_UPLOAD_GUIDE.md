# 🚀 Complete Hostinger Upload & Update Guide for bilal.metalogics.io

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Understanding Your File Structure](#understanding-your-file-structure)
3. [Method 1: Hostinger File Manager (Recommended)](#method-1-hostinger-file-manager-recommended)
4. [Method 2: FTP Upload](#method-2-ftp-upload)
5. [Uploading Different Types of Files](#uploading-different-types-of-files)
6. [Updating Scripts & Code](#updating-scripts--code)
7. [Testing Your Uploads](#testing-your-uploads)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Prerequisites

Before you start, make sure you have:

- ✅ Hostinger hosting account with access to `bilal.metalogics.io`
- ✅ Your Hostinger login credentials
- ✅ Files ready to upload on your local machine
- ✅ Basic understanding of file/folder structure
- ✅ A web browser (Chrome, Firefox, Safari, etc.)

---

## Understanding Your File Structure

### Your Domain Structure:

```
bilal.metalogics.io/
├── public_html/ (Website root - this is where everything goes)
│   ├── index.html (Your main website file)
│   ├── chatbot/ (Widget files)
│   │   ├── metalogics-chatbot.iife.js
│   │   └── metalogics-chatbot.css
│   ├── api/ (Backend files - if hosting on Hostinger)
│   │   ├── dist/ (Built backend files)
│   │   └── package.json
│   ├── assets/ (Images, documents, etc.)
│   └── .htaccess (Server configuration)
```

### What Goes Where:

- **Website files** (HTML, CSS, JS): `public_html/`
- **Chatbot widget**: `public_html/chatbot/`
- **Backend API**: `public_html/api/`
- **Images/Documents**: `public_html/assets/`
- **Configuration files**: `public_html/`

---

## Method 1: Hostinger File Manager (Recommended)

### Step 1: Access Hostinger Panel

1. **Open your web browser**
2. **Go to:** https://hpanel.hostinger.com
3. **Login with your credentials:**
   - Email/Username
   - Password
4. **Click "Login"**

### Step 2: Navigate to File Manager

1. **Find your hosting plan** for `bilal.metalogics.io`
2. **Click on the hosting plan**
3. **Look for "File Manager" button**
4. **Click "File Manager"**

### Step 3: Navigate to Website Root

1. **You'll see a file browser interface**
2. **Look for `public_html` folder**
3. **Double-click to open `public_html`**
4. **This is your website root directory**

### Step 4: Create Necessary Folders

#### For Chatbot Widget:

1. **Right-click in empty space**
2. **Select "New Folder" or "Create Folder"**
3. **Name it:** `chatbot`
4. **Press Enter or click "Create"**

#### For Backend API:

1. **Right-click in empty space**
2. **Select "New Folder"**
3. **Name it:** `api`
4. **Press Enter or click "Create"**

#### For Assets:

1. **Right-click in empty space**
2. **Select "New Folder"**
3. **Name it:** `assets`
4. **Press Enter or click "Create"**

### Step 5: Upload Files

#### Upload Single Files:

1. **Navigate to the target folder** (e.g., `chatbot`)
2. **Click "Upload" or "Upload Files" button**
3. **Click "Select Files" or drag files into the upload area**
4. **Select your file(s) from your computer**
5. **Click "Open"**
6. **Wait for upload to complete**
7. **You'll see a success message**

#### Upload Multiple Files:

1. **Select multiple files** by holding Ctrl (Windows) or Cmd (Mac)
2. **Follow the same upload process**
3. **All files will upload simultaneously**

#### Upload Folders:

1. **Some file managers support folder upload**
2. **Look for "Upload Folder" option**
3. **Select entire folder from your computer**
4. **Folder structure will be preserved**

---

## Method 2: FTP Upload

### Step 1: Get FTP Credentials

1. **In Hostinger panel, go to:** Hosting → FTP Accounts
2. **Note down these details:**
   - **Hostname:** `ftp.bilal.metalogics.io` or provided hostname
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Port:** Usually 21

### Step 2: Download FTP Client

**Recommended FTP Clients:**

- **FileZilla** (Free): https://filezilla-project.org/
- **WinSCP** (Windows): https://winscp.net/
- **Cyberduck** (Mac): https://cyberduck.io/

### Step 3: Connect via FTP

#### Using FileZilla:

1. **Open FileZilla**
2. **Enter connection details:**
   - Host: `ftp.bilal.metalogics.io`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21
3. **Click "Quickconnect"**
4. **Accept any security certificates**

### Step 4: Navigate and Upload

1. **Left side:** Your local computer files
2. **Right side:** Your server files
3. **Navigate to `public_html` on the right side**
4. **Drag files from left to right to upload**
5. **Monitor upload progress in the bottom panel**

---

## Uploading Different Types of Files

### 🤖 Chatbot Widget Files

#### What to Upload:

```
widget/dist/metalogics-chatbot.iife.js
widget/dist/metalogics-chatbot.css
```

#### Where to Upload:

```
public_html/chatbot/
```

#### Step-by-Step:

1. **Build widget locally:**

   ```bash
   cd widget
   npm install
   npm run build
   ```

2. **Navigate to `public_html/chatbot/` in File Manager**

3. **Upload these files:**

   - `metalogics-chatbot.iife.js`
   - `metalogics-chatbot.css`

4. **Verify upload:**
   - Files should appear in the folder
   - Check file sizes match your local files

#### Result URLs:

```
https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js
https://bilal.metalogics.io/chatbot/metalogics-chatbot.css
```

### 🖥️ Backend API Files

#### What to Upload:

```
backend/dist/ (entire folder)
backend/package.json
backend/node_modules/ (if not using npm install on server)
```

#### Where to Upload:

```
public_html/api/
```

#### Step-by-Step:

1. **Build backend locally:**

   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Navigate to `public_html/api/` in File Manager**

3. **Upload these items:**

   - **Entire `dist` folder** (contains compiled JavaScript)
   - **`package.json`** file
   - **`node_modules` folder** (if Hostinger doesn't support npm install)

4. **Set up Node.js (if Hostinger supports it):**
   - Go to Hostinger panel → Node.js
   - Set entry point: `dist/server.js`
   - Install dependencies: `npm install`

### 🌐 Website Files

#### What to Upload:

```
index.html
style.css
script.js
images/
```

#### Where to Upload:

```
public_html/ (root directory)
```

#### Step-by-Step:

1. **Navigate to `public_html/` in File Manager**
2. **Upload your website files directly here**
3. **Create subfolders as needed** (images, css, js)

### 📁 Static Assets

#### What to Upload:

```
Images (.jpg, .png, .gif, .svg)
Documents (.pdf, .doc, .txt)
Videos (.mp4, .webm)
Other files
```

#### Where to Upload:

```
public_html/assets/
```

#### Step-by-Step:

1. **Navigate to `public_html/assets/` in File Manager**
2. **Create subfolders if needed:**
   - `images/`
   - `documents/`
   - `videos/`
3. **Upload files to appropriate subfolders**

---

## Updating Scripts & Code

### 🔄 Widget Updates

#### When You Make Changes to Widget:

1. **Make changes in your local `widget/` folder**

2. **Build updated widget:**

   ```bash
   cd widget
   npm run build
   ```

3. **Upload new files:**

   - Go to `public_html/chatbot/` in File Manager
   - **Delete old files** (optional but recommended)
   - **Upload new files** from `widget/dist/`

4. **Force browser cache refresh:**
   ```html
   <!-- Add version parameter -->
   <script src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js?v=2"></script>
   <link
     rel="stylesheet"
     href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css?v=2"
   />
   ```

#### Update Process:

```bash
# 1. Local development
cd widget
npm run dev  # Test changes

# 2. Build for production
npm run build

# 3. Upload via File Manager
# Navigate to public_html/chatbot/
# Upload new files

# 4. Update version in HTML
# Change ?v=1 to ?v=2 in your script tags
```

### 🖥️ Backend Updates

#### When You Make Changes to Backend:

1. **Make changes in your local `backend/` folder**

2. **Test changes locally:**

   ```bash
   cd backend
   npm run dev
   ```

3. **Build for production:**

   ```bash
   npm run build
   ```

4. **Upload updated files:**

   - Go to `public_html/api/` in File Manager
   - **Upload new `dist/` folder** (overwrite existing)
   - **Upload updated `package.json`** if dependencies changed

5. **Restart Node.js application** (if using Hostinger Node.js hosting):
   - Go to Hostinger panel → Node.js
   - Click "Restart Application"

### 🌐 Website Updates

#### When You Make Changes to Website:

1. **Edit files locally or directly in File Manager**

2. **For local edits:**

   - Make changes to your HTML/CSS/JS files
   - Upload updated files to `public_html/`

3. **For direct edits:**
   - Use File Manager's built-in editor
   - Click on file → "Edit"
   - Make changes and save

### 📝 Configuration Updates

#### Updating .htaccess:

1. **Navigate to `public_html/` in File Manager**
2. **Look for `.htaccess` file** (may be hidden)
3. **Click "Edit" or right-click → "Edit"**
4. **Make your changes:**

   ```apache
   # Enable Gzip compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
   </IfModule>

   # Enable CORS for API
   <IfModule mod_headers.c>
     Header set Access-Control-Allow-Origin "*"
     Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
     Header set Access-Control-Allow-Headers "Content-Type, Authorization"
   </IfModule>

   # Cache static files
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType text/css "access plus 1 year"
     ExpiresByType application/javascript "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType image/jpg "access plus 1 year"
   </IfModule>
   ```

5. **Save the file**

---

## Testing Your Uploads

### ✅ Verify File Upload

#### Check Files Are Accessible:

1. **Test widget files:**

   ```
   https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js
   https://bilal.metalogics.io/chatbot/metalogics-chatbot.css
   ```

   - Should download or display the file content

2. **Test website:**

   ```
   https://bilal.metalogics.io/
   ```

   - Should load your main website

3. **Test API (if applicable):**
   ```
   https://bilal.metalogics.io/api/health
   ```
   - Should return API response

### 🔍 Check Integration

#### Test Widget Integration:

1. **Add widget code to your website:**

   ```html
   <!DOCTYPE html>
   <html>
     <head>
       <title>Your Website</title>
     </head>
     <body>
       <!-- Your website content -->

       <!-- Chatbot Widget Integration -->
       <script src="https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/dist/retell-client-js-sdk.min.js"></script>
       <link
         rel="stylesheet"
         href="https://bilal.metalogics.io/chatbot/metalogics-chatbot.css"
       />
       <script
         src="https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js"
         data-api-key="YOUR_GEMINI_API_KEY"
         data-api-url="https://bilal.metalogics.io/api"
         data-brand-color="#3b82f6"
         data-position="bottom-right"
       ></script>
     </body>
   </html>
   ```

2. **Visit your website:**

   ```
   https://bilal.metalogics.io/
   ```

3. **Look for chat button** in bottom-right corner

4. **Test chat functionality:**
   - Click chat button
   - Send a test message
   - Verify you get a response

### 🐛 Debug Issues

#### Check Browser Console:

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Look for errors:**
   - Red error messages
   - Failed to load resource errors
   - CORS errors

#### Common Issues and Solutions:

**Widget doesn't appear:**

```
Error: Failed to load resource
Solution: Check file URLs are correct and accessible
```

**CORS errors:**

```
Error: Access to fetch blocked by CORS policy
Solution: Add CORS headers to .htaccess or backend
```

**API not responding:**

```
Error: Network error or 500 status
Solution: Check backend is running and API URL is correct
```

---

## Troubleshooting

### 🚨 Common Upload Issues

#### File Not Found (404 Error):

**Problem:** Uploaded file returns 404 when accessed
**Solutions:**

1. **Check file path** - ensure file is in correct folder
2. **Check file name** - ensure exact spelling and case
3. **Check permissions** - file should be readable
4. **Clear browser cache** - try hard refresh (Ctrl+F5)

#### Upload Failed:

**Problem:** File upload doesn't complete
**Solutions:**

1. **Check file size** - Hostinger may have upload limits
2. **Check internet connection** - ensure stable connection
3. **Try smaller files** - upload one file at a time
4. **Use FTP instead** - if File Manager fails

#### Permission Denied:

**Problem:** Can't upload or edit files
**Solutions:**

1. **Check account permissions** - ensure you have write access
2. **Contact Hostinger support** - they can fix permission issues
3. **Try different browser** - sometimes browser-specific issues

### 🔧 Performance Issues

#### Slow Loading:

**Problem:** Website or widget loads slowly
**Solutions:**

1. **Enable Gzip compression** in .htaccess
2. **Optimize file sizes** - compress images, minify CSS/JS
3. **Use CDN** - if available in your Hostinger plan
4. **Add caching headers** in .htaccess

#### High Bandwidth Usage:

**Problem:** Exceeding bandwidth limits
**Solutions:**

1. **Compress files** - use gzip compression
2. **Optimize images** - use WebP format, compress JPEGs
3. **Add cache headers** - reduce repeat downloads
4. **Monitor usage** - check Hostinger analytics

### 🛡️ Security Issues

#### Exposed Sensitive Files:

**Problem:** Configuration files accessible publicly
**Solutions:**

1. **Move sensitive files** outside public_html
2. **Use .htaccess** to deny access:
   ```apache
   <Files ".env">
       Order allow,deny
       Deny from all
   </Files>
   ```
3. **Don't upload** .env files to public directories

#### API Security:

**Problem:** API endpoints accessible without authentication
**Solutions:**

1. **Add rate limiting** to prevent abuse
2. **Implement authentication** for sensitive endpoints
3. **Use HTTPS** - enable SSL certificate
4. **Validate inputs** - prevent injection attacks

---

## Best Practices

### 📁 File Organization

#### Recommended Structure:

```
public_html/
├── index.html                 # Main website
├── assets/                    # Static assets
│   ├── images/
│   ├── css/
│   └── js/
├── chatbot/                   # Widget files
│   ├── metalogics-chatbot.iife.js
│   └── metalogics-chatbot.css
├── api/                       # Backend (if hosted here)
│   ├── dist/
│   └── package.json
└── .htaccess                  # Server configuration
```

#### Naming Conventions:

- **Use lowercase** for file and folder names
- **Use hyphens** instead of spaces: `my-file.js` not `my file.js`
- **Be descriptive** but concise: `user-profile.css` not `up.css`
- **Include version numbers** when needed: `app-v2.js`

### 🔄 Version Control

#### Track Changes:

1. **Keep local backups** of all files
2. **Use version numbers** in file names when updating
3. **Document changes** in a changelog
4. **Test before uploading** - always test locally first

#### Rollback Strategy:

1. **Keep previous versions** on server temporarily
2. **Rename old files** instead of deleting: `app.js.backup`
3. **Have rollback plan** ready if updates fail

### 🚀 Performance Optimization

#### File Optimization:

1. **Minify CSS/JS** files before uploading
2. **Compress images** - use tools like TinyPNG
3. **Use appropriate formats** - WebP for images, WOFF2 for fonts
4. **Remove unused code** - clean up before production

#### Caching Strategy:

```apache
# Add to .htaccess
<IfModule mod_expires.c>
    ExpiresActive On

    # Cache CSS and JS for 1 year
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"

    # Cache images for 1 month
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"

    # Cache HTML for 1 day
    ExpiresByType text/html "access plus 1 day"
</IfModule>
```

### 🔒 Security Best Practices

#### File Security:

1. **Don't upload sensitive files** to public directories
2. **Use environment variables** for API keys (store in backend only)
3. **Set proper file permissions** - 644 for files, 755 for directories
4. **Regular backups** - download copies of important files

#### API Security:

1. **Use HTTPS** - enable SSL certificate
2. **Implement rate limiting** - prevent abuse
3. **Validate all inputs** - sanitize user data
4. **Don't expose internal errors** - use generic error messages

### 📊 Monitoring

#### Track Performance:

1. **Monitor file sizes** - keep track of bandwidth usage
2. **Check loading times** - use tools like GTmetrix
3. **Monitor uptime** - ensure files are always accessible
4. **Review logs** - check for errors or unusual activity

#### Analytics:

1. **Track widget usage** - how many people use the chatbot
2. **Monitor API calls** - track backend usage
3. **User behavior** - see how visitors interact with your site

---

## Quick Reference Commands

### 🏗️ Build Commands

```bash
# Build widget
cd widget
npm run build

# Build backend
cd backend
npm run build

# Install dependencies
npm install
```

### 🌐 Test URLs

```
# Main website
https://bilal.metalogics.io/

# Widget files
https://bilal.metalogics.io/chatbot/metalogics-chatbot.iife.js
https://bilal.metalogics.io/chatbot/metalogics-chatbot.css

# API endpoint (if hosted on Hostinger)
https://bilal.metalogics.io/api/

# Test API health
https://bilal.metalogics.io/api/health
```

### 📁 File Paths

```
# Website root
public_html/

# Widget files
public_html/chatbot/

# Backend files
public_html/api/

# Static assets
public_html/assets/
```

---

## Support Resources

### 📞 Getting Help

#### Hostinger Support:

- **Live Chat:** Available 24/7 in Hostinger panel
- **Knowledge Base:** https://support.hostinger.com
- **Tutorials:** https://www.hostinger.com/tutorials

#### Technical Documentation:

- **File Manager Guide:** Check Hostinger help center
- **FTP Setup:** Look for FTP tutorials in Hostinger docs
- **Node.js Hosting:** Search for Node.js setup guides

#### Community Resources:

- **Hostinger Community:** Official forums
- **Stack Overflow:** For technical coding questions
- **GitHub:** For open-source solutions

### 🆘 Emergency Procedures

#### If Website Goes Down:

1. **Check Hostinger status** - look for service outages
2. **Verify file integrity** - ensure files weren't corrupted
3. **Check .htaccess** - syntax errors can break the site
4. **Contact support** - if issue persists

#### If Upload Fails:

1. **Try different browser** - clear cache and cookies
2. **Use FTP instead** - more reliable for large files
3. **Check file permissions** - ensure you have write access
4. **Split large uploads** - upload files individually

---

## Conclusion

You now have a complete guide for uploading files to your Hostinger domain `bilal.metalogics.io` and updating your scripts. Remember to:

✅ **Always test locally first** before uploading
✅ **Keep backups** of important files
✅ **Use version control** to track changes
✅ **Monitor performance** and security
✅ **Follow best practices** for file organization

Your website at `https://bilal.metalogics.io` should now be fully functional with your chatbot widget and backend API!

---

_Last updated: December 2024_
_For questions or issues, refer to the troubleshooting section or contact Hostinger support._
