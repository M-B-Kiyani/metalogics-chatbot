#!/usr/bin/env node

/**
 * Railway Deployment Troubleshooting Script
 * Helps diagnose common Railway deployment issues
 */

const https = require("https");

const BACKEND_URL = "https://metalogics-chatbot-production.up.railway.app";

console.log("🔍 Railway Deployment Troubleshooting\n");
console.log(`Testing: ${BACKEND_URL}\n`);

// Test different endpoints to understand the issue
async function testEndpoint(path, description) {
  console.log(`Testing ${description}: ${path}`);

  return new Promise((resolve) => {
    const req = https.request(
      `${BACKEND_URL}${path}`,
      {
        method: "GET",
        timeout: 10000,
      },
      (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (data) {
            console.log(
              `   Response: ${data.substring(0, 200)}${
                data.length > 200 ? "..." : ""
              }`
            );
          }
          console.log("");
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      console.log("");
      resolve();
    });

    req.on("timeout", () => {
      console.log("   ❌ Request timed out");
      console.log("");
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.log("🏥 Running diagnostics...\n");

  await testEndpoint("/", "Root endpoint");
  await testEndpoint("/health", "Health endpoint");
  await testEndpoint("/api/health", "API health endpoint");

  console.log("📋 Common Railway Deployment Issues:\n");

  console.log("1️⃣ **Build Failures**");
  console.log("   - Check Railway build logs for npm install errors");
  console.log("   - Verify package.json dependencies are correct");
  console.log("   - Check if TypeScript compilation succeeds");
  console.log("");

  console.log("2️⃣ **Environment Variables Missing**");
  console.log("   - DATABASE_URL (auto-provided by Railway PostgreSQL)");
  console.log("   - API_KEY (required for authentication)");
  console.log("   - NODE_ENV=production");
  console.log("   - SMTP configuration for emails");
  console.log("");

  console.log("3️⃣ **Database Connection Issues**");
  console.log("   - Ensure PostgreSQL service is added to Railway project");
  console.log("   - Check if DATABASE_URL is automatically set");
  console.log("   - Verify database migrations ran successfully");
  console.log("");

  console.log("4️⃣ **Port Binding Issues**");
  console.log(
    "   - App should listen on process.env.PORT (Railway provides this)"
  );
  console.log("   - App should bind to 0.0.0.0, not localhost/127.0.0.1");
  console.log('   - Current config: server.listen(PORT, "0.0.0.0") ✅');
  console.log("");

  console.log("5️⃣ **Start Command Issues**");
  console.log("   - Railway uses: npm start");
  console.log('   - package.json start script: "node dist/server.js" ✅');
  console.log("   - Ensure dist/server.js exists after build");
  console.log("");

  console.log("🔧 **Immediate Actions to Take:**\n");

  console.log("1. **Check Railway Logs**");
  console.log("   - Go to Railway Dashboard → Your Project → Backend Service");
  console.log('   - Click "Deployments" tab → Latest deployment');
  console.log('   - Check both "Build Logs" and "Deploy Logs"');
  console.log("");

  console.log("2. **Verify Environment Variables**");
  console.log("   - Go to Railway Dashboard → Variables tab");
  console.log("   - Ensure these are set:");
  console.log("     * NODE_ENV=production");
  console.log("     * API_KEY=your-api-key");
  console.log("     * DATABASE_URL (should be auto-set if PostgreSQL added)");
  console.log("");

  console.log("3. **Add PostgreSQL Service** (if not already added)");
  console.log('   - In Railway Dashboard, click "New Service"');
  console.log('   - Select "PostgreSQL"');
  console.log("   - Railway will auto-set DATABASE_URL");
  console.log("");

  console.log("4. **Force Redeploy**");
  console.log("   - In Railway Dashboard → Deployments");
  console.log('   - Click "Redeploy" on the latest deployment');
  console.log("   - Or push a small change to trigger new deployment");
  console.log("");

  console.log("5. **Check Service Status**");
  console.log('   - In Railway Dashboard, service should show "Active"');
  console.log('   - If showing "Crashed" or "Failed", check logs');
  console.log("");

  console.log("📞 **Next Steps:**");
  console.log("1. Check Railway logs and share any error messages");
  console.log("2. Verify all environment variables are set");
  console.log("3. Ensure PostgreSQL service is connected");
  console.log("4. Try redeploying the service");
  console.log("");

  console.log("💡 **Quick Test After Fixes:**");
  console.log(`   curl ${BACKEND_URL}/health`);
  console.log(`   curl ${BACKEND_URL}/api/health`);
}

runDiagnostics().catch(console.error);
