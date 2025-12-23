#!/usr/bin/env node

/**
 * Railway Deployment Helper Script
 * Guides users through the Railway deployment process
 */

const fs = require("fs");
const { execSync } = require("child_process");

console.log("🚀 Railway Deployment Helper\n");

// Check if Railway CLI is installed
function checkRailwayCLI() {
  try {
    execSync("railway --version", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if user is logged in to Railway
function checkRailwayAuth() {
  try {
    execSync("railway whoami", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

// Main deployment flow
async function deployToRailway() {
  console.log("1️⃣ Checking prerequisites...\n");

  // Check Railway CLI
  if (!checkRailwayCLI()) {
    console.log("❌ Railway CLI not found");
    console.log("📥 Install Railway CLI:");
    console.log("   npm install -g @railway/cli");
    console.log("   # or");
    console.log("   curl -fsSL https://railway.app/install.sh | sh\n");
    return;
  }
  console.log("✅ Railway CLI installed");

  // Check authentication
  if (!checkRailwayAuth()) {
    console.log("❌ Not logged in to Railway");
    console.log("🔐 Login to Railway:");
    console.log("   railway login\n");
    return;
  }
  console.log("✅ Logged in to Railway");

  // Validate configuration
  console.log("\n2️⃣ Validating configuration...\n");
  try {
    execSync("node validate-production-config.js", { stdio: "inherit" });
  } catch (error) {
    console.log("\n❌ Configuration validation failed");
    console.log("Please fix the issues above before deploying");
    return;
  }

  console.log("\n3️⃣ Railway deployment options...\n");
  console.log("Choose your deployment method:");
  console.log("");
  console.log("🔗 Option A: GitHub Integration (Recommended)");
  console.log("   1. Push your code to GitHub");
  console.log("   2. Go to https://railway.app/dashboard");
  console.log('   3. Click "New Project" → "Deploy from GitHub repo"');
  console.log("   4. Select your repository");
  console.log("   5. Railway will auto-deploy on every push");
  console.log("");
  console.log("⚡ Option B: Direct CLI Deploy");
  console.log("   1. Run: railway login");
  console.log("   2. Run: railway link (to connect to existing project)");
  console.log("   3. Run: railway up (to deploy current code)");
  console.log("");

  console.log("4️⃣ Required environment variables...\n");
  console.log("Add these in Railway dashboard → Variables:");
  console.log("");
  console.log("🔑 Essential Variables:");
  console.log(
    "   DATABASE_URL=postgresql://...  # Auto-provided by Railway PostgreSQL"
  );
  console.log("   API_KEY=your-secure-32-char-key");
  console.log("   NODE_ENV=production");
  console.log("");
  console.log("📧 Email Configuration:");
  console.log("   SMTP_HOST=smtp.gmail.com");
  console.log("   SMTP_PORT=587");
  console.log("   SMTP_USER=your-email@gmail.com");
  console.log("   SMTP_PASSWORD=your-app-password");
  console.log("   ADMIN_EMAIL=admin@yourdomain.com");
  console.log("");
  console.log("🌐 CORS Configuration:");
  console.log(
    "   ALLOWED_ORIGINS=https://your-frontend.com,https://your-widget.com"
  );
  console.log("");
  console.log("🔧 Optional Integrations:");
  console.log("   GOOGLE_CALENDAR_ENABLED=true");
  console.log('   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}');
  console.log("   HUBSPOT_ENABLED=true");
  console.log("   HUBSPOT_ACCESS_TOKEN=your-token");
  console.log("   RETELL_ENABLED=true");
  console.log("   RETELL_API_KEY=your-key");
  console.log("   RETELL_AGENT_ID=your-agent-id");
  console.log("");

  console.log("5️⃣ Add PostgreSQL database...\n");
  console.log("In Railway dashboard:");
  console.log('   1. Click "New Service"');
  console.log('   2. Select "PostgreSQL"');
  console.log("   3. Railway will auto-set DATABASE_URL");
  console.log("");

  console.log("6️⃣ Deploy and test...\n");
  console.log("After deployment:");
  console.log("   1. Check deployment logs in Railway dashboard");
  console.log(
    "   2. Test health endpoint: https://your-app.railway.app/health"
  );
  console.log("   3. Test API: https://your-app.railway.app/api/health");
  console.log("");

  console.log("🔍 Troubleshooting...\n");
  console.log("If deployment fails:");
  console.log("   • Check Railway logs for errors");
  console.log("   • Verify all environment variables are set");
  console.log("   • Ensure DATABASE_URL is connected");
  console.log("   • Check CORS origins include your frontend domain");
  console.log("");

  console.log("📚 Resources:");
  console.log("   • Railway Docs: https://docs.railway.app");
  console.log("   • Deployment Guide: ./PRODUCTION_DEPLOYMENT_CHECKLIST.md");
  console.log(
    "   • Configuration Validator: node validate-production-config.js"
  );
  console.log("");

  console.log("🎉 Ready to deploy! Choose Option A or B above.");
}

// Run the deployment helper
deployToRailway().catch(console.error);
