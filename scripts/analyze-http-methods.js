/**
 * HTTP Methods Analysis Script
 * Analyzes the codebase to determine supported HTTP methods without requiring a running server
 */

const fs = require("fs");
const path = require("path");

// Helper function to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return null;
  }
}

// Extract HTTP methods from route files
function analyzeRouteFile(filePath) {
  const content = readFile(filePath);
  if (!content) return [];

  const methods = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Look for router.method() calls
    const routerMatch = line.match(
      /router\.(get|post|put|patch|delete|options|use)\s*\(/i
    );
    if (routerMatch) {
      const method = routerMatch[1].toUpperCase();

      // Get the route path from the same line or next few lines
      let routePath = "";
      const pathMatch = line.match(/["'`]([^"'`]+)["'`]/);
      if (pathMatch) {
        routePath = pathMatch[1];
      }

      // Look for middleware or controller info
      let hasAuth = false;
      let hasValidation = false;
      let hasRateLimit = false;

      // Check current line and next few lines for middleware
      for (let i = index; i < Math.min(index + 5, lines.length); i++) {
        const checkLine = lines[i];
        if (
          checkLine.includes("validateApiKey") ||
          checkLine.includes("widgetAuthMiddleware")
        ) {
          hasAuth = true;
        }
        if (
          checkLine.includes("validateBody") ||
          checkLine.includes("validateQuery")
        ) {
          hasValidation = true;
        }
        if (checkLine.includes("rateLimiter")) {
          hasRateLimit = true;
        }
      }

      methods.push({
        method,
        path: routePath,
        hasAuth,
        hasValidation,
        hasRateLimit,
        line: index + 1,
      });
    }
  });

  return methods;
}

// Analyze CORS configuration
function analyzeCorsConfig() {
  const configPath = path.join(__dirname, "../backend/src/config/index.ts");
  const content = readFile(configPath);

  if (!content) return null;

  // Extract CORS methods from config
  const methodsMatch = content.match(
    /ALLOWED_METHODS.*?default.*?["'`]([^"'`]+)["'`]/s
  );
  const allowedMethods = methodsMatch
    ? methodsMatch[1].split(",").map((m) => m.trim())
    : [];

  // Extract other CORS settings
  const originsMatch = content.match(
    /ALLOWED_ORIGINS.*?default.*?["'`]([^"'`]+)["'`]/s
  );
  const allowedOrigins = originsMatch ? originsMatch[1] : "";

  const headersMatch = content.match(
    /ALLOWED_HEADERS.*?default.*?["'`]([^"'`]+)["'`]/s
  );
  const allowedHeaders = headersMatch
    ? headersMatch[1].split(",").map((h) => h.trim())
    : [];

  return {
    allowedMethods,
    allowedOrigins,
    allowedHeaders,
    credentials: true, // From the config analysis
    maxAge: 86400,
  };
}

// Main analysis function
function analyzeHttpMethods() {
  console.log("🔍 Analyzing HTTP Methods Support in Codebase");
  console.log("=".repeat(60));

  // Route files to analyze
  const routeFiles = [
    { name: "Booking Routes", path: "../backend/src/routes/booking.routes.ts" },
    { name: "Health Routes", path: "../backend/src/routes/health.routes.ts" },
    {
      name: "Available Slots Routes",
      path: "../backend/src/routes/availableSlots.routes.ts",
    },
    {
      name: "Conversation Routes",
      path: "../backend/src/routes/conversation.routes.ts",
    },
    { name: "Retell Routes", path: "../backend/src/routes/retell.routes.ts" },
    { name: "Widget Routes", path: "../backend/src/routes/widget.routes.ts" },
  ];

  const allMethods = new Set();
  const serviceAnalysis = {};

  // Analyze each route file
  routeFiles.forEach(({ name, path: filePath }) => {
    console.log(`\n📁 ${name}`);
    console.log("-".repeat(40));

    const fullPath = path.join(__dirname, filePath);
    const methods = analyzeRouteFile(fullPath);

    if (methods.length === 0) {
      console.log("  ❌ No routes found or file not accessible");
      return;
    }

    serviceAnalysis[name] = methods;

    // Group by HTTP method
    const methodGroups = {};
    methods.forEach((method) => {
      if (!methodGroups[method.method]) {
        methodGroups[method.method] = [];
      }
      methodGroups[method.method].push(method);
      allMethods.add(method.method);
    });

    // Display methods for this service
    Object.entries(methodGroups).forEach(([method, routes]) => {
      console.log(`  ✅ ${method}: ${routes.length} endpoint(s)`);
      routes.forEach((route) => {
        const authIcon = route.hasAuth ? "🔐" : "🌐";
        const validationIcon = route.hasValidation ? "✓" : "";
        const rateLimitIcon = route.hasRateLimit ? "⏱️" : "";
        console.log(
          `    ${authIcon} ${
            route.path || "(root)"
          } ${validationIcon} ${rateLimitIcon}`
        );
      });
    });
  });

  // Analyze CORS configuration
  console.log("\n🌐 CORS Configuration Analysis");
  console.log("-".repeat(40));

  const corsConfig = analyzeCorsConfig();
  if (corsConfig) {
    console.log(
      `  ✅ Allowed Methods: ${corsConfig.allowedMethods.join(", ")}`
    );
    console.log(`  ✅ Allowed Origins: ${corsConfig.allowedOrigins}`);
    console.log(
      `  ✅ Allowed Headers: ${corsConfig.allowedHeaders.join(", ")}`
    );
    console.log(`  ✅ Credentials: ${corsConfig.credentials}`);
    console.log(`  ✅ Max Age: ${corsConfig.maxAge} seconds`);
  } else {
    console.log("  ❌ Could not analyze CORS configuration");
  }

  // Summary
  console.log("\n📊 Summary");
  console.log("=".repeat(60));
  console.log(
    `✅ Total HTTP Methods Supported: ${Array.from(allMethods)
      .sort()
      .join(", ")}`
  );
  console.log(
    `📈 Total Services Analyzed: ${Object.keys(serviceAnalysis).length}`
  );

  // Method distribution
  const methodCounts = {};
  Object.values(serviceAnalysis)
    .flat()
    .forEach((method) => {
      methodCounts[method.method] = (methodCounts[method.method] || 0) + 1;
    });

  console.log("\n📋 Method Distribution:");
  Object.entries(methodCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([method, count]) => {
      console.log(`  ${method}: ${count} endpoints`);
    });

  // Authentication analysis
  const authEndpoints = Object.values(serviceAnalysis)
    .flat()
    .filter((m) => m.hasAuth).length;
  const totalEndpoints = Object.values(serviceAnalysis).flat().length;

  console.log("\n🔒 Security Analysis:");
  console.log(
    `  🔐 Authenticated Endpoints: ${authEndpoints}/${totalEndpoints}`
  );
  console.log(
    `  🌐 Public Endpoints: ${totalEndpoints - authEndpoints}/${totalEndpoints}`
  );

  // Recommendations
  console.log("\n💡 Recommendations:");

  if (
    allMethods.has("GET") &&
    allMethods.has("POST") &&
    allMethods.has("PUT") &&
    allMethods.has("PATCH") &&
    allMethods.has("DELETE")
  ) {
    console.log("  ✅ Complete CRUD operations supported");
  } else {
    console.log("  ⚠️  Some CRUD operations may be missing");
  }

  if (corsConfig && corsConfig.allowedMethods.includes("OPTIONS")) {
    console.log("  ✅ CORS preflight requests supported");
  } else {
    console.log("  ⚠️  OPTIONS method should be explicitly supported for CORS");
  }

  console.log(
    "  💡 Consider implementing HEAD method for metadata-only requests"
  );
  console.log(
    "  💡 Ensure all endpoints have proper error handling for unsupported methods"
  );

  return {
    allMethods: Array.from(allMethods),
    serviceAnalysis,
    corsConfig,
    summary: {
      totalServices: Object.keys(serviceAnalysis).length,
      totalEndpoints,
      authEndpoints,
      methodCounts,
    },
  };
}

// Export for use as module or run directly
if (require.main === module) {
  analyzeHttpMethods();
}

module.exports = { analyzeHttpMethods };
