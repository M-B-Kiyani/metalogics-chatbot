#!/usr/bin/env node

/**
 * Production Configuration Validator
 * Validates that the application is properly configured for Railway deployment
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validating Production Configuration for Railway...\n");

let hasErrors = false;
const warnings = [];
const errors = [];

// Check 1: Server Configuration
console.log("1️⃣ Checking server configuration...");
try {
  const serverFile = fs.readFileSync("backend/src/server.ts", "utf8");

  if (serverFile.includes('app.listen(PORT, "0.0.0.0"')) {
    console.log("   ✅ Server listens on 0.0.0.0 (correct for Railway)");
  } else if (
    serverFile.includes("127.0.0.1") ||
    serverFile.includes("localhost")
  ) {
    errors.push(
      "Server is configured to listen on localhost/127.0.0.1 instead of 0.0.0.0"
    );
    hasErrors = true;
  } else {
    console.log("   ✅ Server configuration looks good");
  }

  if (
    serverFile.includes("config.server.port") ||
    serverFile.includes("process.env.PORT")
  ) {
    console.log("   ✅ Server uses dynamic port configuration");
  } else {
    errors.push("Server should use process.env.PORT for Railway compatibility");
    hasErrors = true;
  }
} catch (err) {
  errors.push("Could not read backend/src/server.ts");
  hasErrors = true;
}

// Check 2: Dockerfile Configuration
console.log("\n2️⃣ Checking Dockerfile configuration...");
try {
  const dockerfile = fs.readFileSync("backend/Dockerfile", "utf8");

  if (dockerfile.includes("http://0.0.0.0:${PORT")) {
    console.log("   ✅ Dockerfile health check uses 0.0.0.0");
  } else if (dockerfile.includes("127.0.0.1")) {
    errors.push("Dockerfile health check uses 127.0.0.1 instead of 0.0.0.0");
    hasErrors = true;
  } else {
    console.log("   ✅ Dockerfile configuration looks good");
  }

  if (dockerfile.includes("EXPOSE $PORT")) {
    console.log("   ✅ Dockerfile exposes dynamic port");
  } else if (dockerfile.includes("EXPOSE 3000")) {
    warnings.push(
      "Dockerfile exposes hardcoded port 3000 - consider using $PORT"
    );
  }
} catch (err) {
  errors.push("Could not read backend/Dockerfile");
  hasErrors = true;
}

// Check 3: Railway Configuration
console.log("\n3️⃣ Checking Railway configuration...");
try {
  const railwayConfig = JSON.parse(
    fs.readFileSync("backend/railway.json", "utf8")
  );

  if (
    railwayConfig.deploy &&
    railwayConfig.deploy.healthcheckPath === "/health"
  ) {
    console.log("   ✅ Railway health check path configured");
  } else {
    warnings.push("Railway health check path should be set to /health");
  }

  if (
    railwayConfig.deploy &&
    railwayConfig.deploy.startCommand === "npm start"
  ) {
    console.log("   ✅ Railway start command configured");
  } else {
    errors.push('Railway start command should be "npm start"');
    hasErrors = true;
  }
} catch (err) {
  errors.push("Could not read backend/railway.json");
  hasErrors = true;
}

// Check 4: Package.json Scripts
console.log("\n4️⃣ Checking package.json scripts...");
try {
  const packageJson = JSON.parse(
    fs.readFileSync("backend/package.json", "utf8")
  );

  if (
    packageJson.scripts &&
    packageJson.scripts.start === "node dist/server.js"
  ) {
    console.log("   ✅ Start script points to compiled server");
  } else {
    errors.push('Start script should be "node dist/server.js"');
    hasErrors = true;
  }

  if (packageJson.scripts && packageJson.scripts.build) {
    console.log("   ✅ Build script exists");
  } else {
    errors.push("Build script is required for production deployment");
    hasErrors = true;
  }
} catch (err) {
  errors.push("Could not read backend/package.json");
  hasErrors = true;
}

// Check 5: Environment Configuration
console.log("\n5️⃣ Checking environment configuration...");
try {
  const configFile = fs.readFileSync("backend/src/config/index.ts", "utf8");

  if (
    configFile.includes("PORT: z") &&
    configFile.includes("transform((val) => parseInt(val, 10))")
  ) {
    console.log("   ✅ Port configuration uses environment variable");
  } else {
    errors.push("Port configuration should use process.env.PORT");
    hasErrors = true;
  }

  if (configFile.includes('.default("3000")')) {
    console.log("   ✅ Port has fallback default");
  } else {
    warnings.push("Consider adding a default port fallback");
  }
} catch (err) {
  errors.push("Could not read backend/src/config/index.ts");
  hasErrors = true;
}

// Check 6: CORS Configuration
console.log("\n6️⃣ Checking CORS configuration...");
try {
  const envExample = fs.readFileSync("backend/.env.example", "utf8");

  if (envExample.includes("ALLOWED_ORIGINS")) {
    console.log("   ✅ CORS origins configuration documented");
  } else {
    warnings.push("CORS origins should be documented in .env.example");
  }
} catch (err) {
  warnings.push("Could not read backend/.env.example");
}

// Summary
console.log("\n" + "=".repeat(50));
console.log("📋 VALIDATION SUMMARY");
console.log("=".repeat(50));

if (hasErrors) {
  console.log("\n❌ ERRORS FOUND:");
  errors.forEach((error) => console.log(`   • ${error}`));
}

if (warnings.length > 0) {
  console.log("\n⚠️  WARNINGS:");
  warnings.forEach((warning) => console.log(`   • ${warning}`));
}

if (!hasErrors && warnings.length === 0) {
  console.log("\n🎉 ALL CHECKS PASSED!");
  console.log("✅ Your application is ready for Railway deployment");
  console.log("\n🚀 Next steps:");
  console.log("   1. Push your code to GitHub");
  console.log("   2. Connect Railway to your repository");
  console.log("   3. Add environment variables in Railway dashboard");
  console.log("   4. Deploy and test!");
} else if (!hasErrors) {
  console.log("\n✅ CONFIGURATION IS VALID");
  console.log("⚠️  Please review warnings above");
  console.log("🚀 Ready for Railway deployment!");
} else {
  console.log("\n❌ CONFIGURATION NEEDS FIXES");
  console.log("Please fix the errors above before deploying");
  process.exit(1);
}

console.log(
  "\n📚 For detailed deployment guide, see: PRODUCTION_DEPLOYMENT_CHECKLIST.md"
);
