import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Check if dist exists
if (!fs.existsSync(distPath)) {
  console.error(`CRITICAL: dist directory not found at ${distPath}`);
} else {
  console.log(`Serving static files from ${distPath}`);
  console.log('Contents of dist:', fs.readdirSync(distPath));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Serve static files from dist directory
// Fallback to avoid crashing on missing files
app.use(express.static(distPath, {
  fallthrough: true
}));

// Handle React Router - send all requests to index.html
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send("Index.html not found. Build may have failed.");
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend server running on port ${port}`);
});
