# Metalogics Chatbot Widget - Deployment Guide

## 📦 Deployment Options

This guide covers multiple ways to deploy your chatbot widget to production.

---

## Option 1: Your Own Web Server

### Build the Widget

```bash
cd widget
npm install
npm run build
```

### Upload Files

Upload these files to your web server:

- `dist/metalogics-chatbot.iife.js`
- `dist/metalogics-chatbot.css`

### Example: Apache/Nginx

```bash
# Copy to web server
scp dist/* user@yourserver.com:/var/www/html/chatbot/

# Or use FTP/SFTP client
```

### Configure Web Server

**Nginx:**

```nginx
location /chatbot/ {
    alias /var/www/html/chatbot/;

    # Enable CORS if needed
    add_header Access-Control-Allow-Origin *;

    # Cache for 1 year
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Apache (.htaccess):**

```apache
<IfModule mod_headers.c>
    # Enable CORS
    Header set Access-Control-Allow-Origin "*"

    # Cache for 1 year
    <FilesMatch "\.(js|css)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
</IfModule>
```

---

## Option 2: AWS S3 + CloudFront (Recommended)

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://your-chatbot-widget
```

### Step 2: Upload Files

```bash
cd widget
npm run build

# Upload with public-read ACL
aws s3 cp dist/ s3://your-chatbot-widget/ \
  --recursive \
  --acl public-read \
  --cache-control "max-age=31536000"
```

### Step 3: Configure S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-chatbot-widget/*"
    }
  ]
}
```

### Step 4: Enable CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Step 5: Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name your-chatbot-widget.s3.amazonaws.com \
  --default-root-object index.html
```

**Your widget URL:**

```
https://d1234567890.cloudfront.net/metalogics-chatbot.iife.js
https://d1234567890.cloudfront.net/metalogics-chatbot.css
```

---

## Option 3: Netlify

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Build and Deploy

```bash
cd widget
npm run build
netlify deploy --prod --dir=dist
```

### Step 3: Get URLs

Netlify will provide URLs like:

```
https://your-site.netlify.app/metalogics-chatbot.iife.js
https://your-site.netlify.app/metalogics-chatbot.css
```

### Alternative: Drag & Drop

1. Go to https://app.netlify.com/drop
2. Drag the `dist` folder
3. Get your URLs

---

## Option 4: Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

```bash
cd widget
npm run build
vercel --prod
```

### Step 3: Configure vercel.json

```json
{
  "version": 2,
  "public": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## Option 5: GitHub Pages

### Step 1: Build

```bash
cd widget
npm run build
```

### Step 2: Create gh-pages Branch

```bash
git checkout -b gh-pages
git add dist -f
git commit -m "Deploy widget"
git push origin gh-pages
```

### Step 3: Enable GitHub Pages

1. Go to repository Settings
2. Pages → Source → gh-pages branch
3. Save

**Your widget URL:**

```
https://yourusername.github.io/your-repo/dist/metalogics-chatbot.iife.js
```

---

## Option 6: CDN (jsDelivr, unpkg)

### For npm packages:

If you publish to npm:

```bash
npm publish
```

**Auto-CDN URLs:**

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/metalogics-chatbot-widget@latest/dist/metalogics-chatbot.iife.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/metalogics-chatbot-widget@latest/dist/metalogics-chatbot.iife.js"></script>
```

---

## 🔒 Security Best Practices

### 1. Use Environment Variables

Never hardcode API keys in the widget. Use backend proxy:

```javascript
// Backend proxy
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY; // From env
  // ... use apiKey
});
```

### 2. Enable HTTPS

Required for microphone access:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### 3. Implement Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/chat", limiter);
```

### 4. Validate Inputs

```javascript
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid message" });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: "Message too long" });
  }

  // Process message...
});
```

### 5. Set CSP Headers

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';";
```

---

## 🚀 Performance Optimization

### 1. Enable Compression

**Nginx:**

```nginx
gzip on;
gzip_types text/css application/javascript;
gzip_min_length 1000;
```

**Express:**

```javascript
const compression = require("compression");
app.use(compression());
```

### 2. Set Cache Headers

```nginx
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Use CDN

Serve static files from CDN for faster global delivery.

### 4. Lazy Load Widget

```html
<script>
  // Load widget after page load
  window.addEventListener("load", () => {
    const script = document.createElement("script");
    script.src = "https://your-cdn.com/metalogics-chatbot.iife.js";
    document.body.appendChild(script);
  });
</script>
```

### 5. Preload Resources

```html
<link
  rel="preload"
  href="https://your-cdn.com/metalogics-chatbot.iife.js"
  as="script"
/>
<link
  rel="preload"
  href="https://your-cdn.com/metalogics-chatbot.css"
  as="style"
/>
```

---

## 📊 Monitoring & Analytics

### 1. Track Widget Usage

```javascript
// In your backend
app.post("/api/chat", (req, res) => {
  // Log to analytics
  analytics.track("chat_message_sent", {
    sessionId: req.body.sessionId,
    timestamp: new Date(),
  });

  // Process message...
});
```

### 2. Error Tracking

```javascript
// Sentry example
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### 3. Performance Monitoring

```javascript
// Measure widget load time
const startTime = performance.now();

window.MetalogicsChatbot.init({
  // ... config
  onReady: () => {
    const loadTime = performance.now() - startTime;
    console.log(`Widget loaded in ${loadTime}ms`);
  },
});
```

---

## 🧪 Testing Deployment

### 1. Test Locally

```bash
npm run build
npm run serve
# Open http://localhost:4173
```

### 2. Test on Staging

```bash
# Deploy to staging environment
aws s3 cp dist/ s3://staging-chatbot-widget/ --recursive
```

### 3. Test Production

```bash
# Deploy to production
aws s3 cp dist/ s3://prod-chatbot-widget/ --recursive
```

### 4. Smoke Tests

```bash
# Check if files are accessible
curl -I https://your-cdn.com/metalogics-chatbot.iife.js
curl -I https://your-cdn.com/metalogics-chatbot.css

# Should return 200 OK
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Widget

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd widget
          npm ci

      - name: Build
        run: |
          cd widget
          npm run build

      - name: Deploy to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 sync widget/dist/ s3://your-chatbot-widget/ \
            --delete \
            --cache-control "max-age=31536000"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id YOUR_DISTRIBUTION_ID \
            --paths "/*"
```

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Build widget: `npm run build`
- [ ] Test locally: `npm run serve`
- [ ] Upload files to CDN/server
- [ ] Configure CORS headers
- [ ] Enable HTTPS
- [ ] Set cache headers
- [ ] Test on staging environment
- [ ] Update API keys in production
- [ ] Test widget on production site
- [ ] Monitor for errors
- [ ] Set up analytics tracking

---

## 🆘 Troubleshooting

### Files not loading

- Check CORS headers
- Verify file URLs are correct
- Check browser console for errors

### Widget not initializing

- Ensure Retell SDK loads first
- Check API key is set
- Verify backend is accessible

### Performance issues

- Enable compression
- Use CDN
- Check network tab in DevTools

---

## 📞 Support

For deployment issues:

- Email: support@metalogics.io
- Docs: https://metalogics.io/docs

---

**Your widget is now ready for production!** 🚀
