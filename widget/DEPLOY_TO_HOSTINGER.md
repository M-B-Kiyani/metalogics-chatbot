# Deploying Metalogics Chatbot Widget to Hostinger

This guide explains how to build and deploy the chatbot widget to Hostinger.

## Prerequisites

1.  **Node.js & npm**: Ensure you have a working Node.js environment.
2.  **Hostinger Account**: Access to your Hostinger control panel (hPanel).
3.  **FTP Client (Optional)**: FileZilla or similar, or use Hostinger's File Manager.

## 1. Build the Widget

First, you need to compile the widget source code into a single JavaScript file and CSS file.

Run the following commands in the `widget` directory:

```bash
# Clean install dependencies (fixes potential npm issues)
rm -rf node_modules package-lock.json
npm install

# Build the project
npm run build
```

**Troubleshooting Build Issues:**
If `npm install` fails with errors like `properties of null`, try clearing your cache:
```bash
npm cache clean --force
npm install
```

## 2. Locate Build Artifacts

After a successful build, a `dist` folder will be created in the `widget` directory. It should contain:

*   `metalogics-chatbot.iife.js` (The main script)
*   `metalogics-chatbot.css` (The styles)
*   Assets (images, svgs, etc.)

## 3. Upload to Hostinger

1.  **Login to Hostinger**: Go to the hPanel.
2.  **File Manager**: Open `Files` > `File Manager`.
3.  **Navigate**: Go to `public_html`.
4.  **Create Folder**: Create a new folder named `widget` (or `chat-widget`).
5.  **Upload**: Upload the **contents** of the `dist` folder into this new `public_html/widget` folder.

   Your file structure on the server should look like:
   ```
   public_html/
   ├── widget/
   │   ├── metalogics-chatbot.iife.js
   │   ├── metalogics-chatbot.css
   │   └── ...
   ```

## 4. Usage in Your Website

Now dependencies are hosted, you can embed the widget on any website using the following snippet.

Replace `YOUR_WEBSITE.com` with your actual domain.

```html
<!-- Metalogics Chatbot Widget -->
<link rel="stylesheet" href="https://YOUR_WEBSITE.com/widget/metalogics-chatbot.css">
<script 
  src="https://YOUR_WEBSITE.com/widget/metalogics-chatbot.iife.js"
  data-api-key="YOUR_PUBLIC_WIDGET_KEY"
  data-api-url="https://your-backend-url.railway.app"
  data-brand-color="#2563eb"
  data-position="bottom-right"
></script>
```

## 5. Verify Deployment

1.  Visit `https://YOUR_WEBSITE.com/widget/metalogics-chatbot.iife.js` in your browser. You should see the JavaScript code.
2.  Add the embed code to a test HTML page and check if the widget appears.
