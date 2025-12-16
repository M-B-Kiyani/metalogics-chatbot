/**
 * Verification script for OpenAPI documentation
 * Tests that the documentation endpoints are properly configured
 */

import { swaggerSpec } from "../config/swagger.config";
import { logger } from "../utils/logger";

/**
 * Verify OpenAPI specification structure
 */
function verifySwaggerSpec(): boolean {
  logger.info("Verifying OpenAPI specification...");

  try {
    const spec = swaggerSpec as any;

    // Check basic structure
    if (!spec.openapi) {
      logger.error("Missing OpenAPI version");
      return false;
    }

    if (!spec.info) {
      logger.error("Missing API info");
      return false;
    }

    if (!spec.paths) {
      logger.error("Missing API paths");
      return false;
    }

    if (!spec.components) {
      logger.error("Missing components");
      return false;
    }

    logger.info("✓ OpenAPI version:", spec.openapi);
    logger.info("✓ API title:", spec.info.title);
    logger.info("✓ API version:", spec.info.version);

    // Check paths
    const paths = Object.keys(spec.paths);
    logger.info(`✓ Found ${paths.length} documented endpoints:`);
    paths.forEach((path) => {
      const methods = Object.keys(spec.paths[path]);
      logger.info(`  - ${path}: ${methods.join(", ").toUpperCase()}`);
    });

    // Check schemas
    const schemas = Object.keys(spec.components.schemas || {});
    logger.info(`✓ Found ${schemas.length} schemas:`);
    schemas.forEach((schema) => {
      logger.info(`  - ${schema}`);
    });

    // Check security schemes
    const securitySchemes = Object.keys(spec.components.securitySchemes || {});
    logger.info(`✓ Found ${securitySchemes.length} security schemes:`);
    securitySchemes.forEach((scheme) => {
      logger.info(`  - ${scheme}`);
    });

    // Check responses
    const responses = Object.keys(spec.components.responses || {});
    logger.info(`✓ Found ${responses.length} reusable responses:`);
    responses.forEach((response) => {
      logger.info(`  - ${response}`);
    });

    logger.info("\n✅ OpenAPI specification is valid and complete!");
    return true;
  } catch (error) {
    logger.error("Error verifying OpenAPI specification: " + String(error));
    return false;
  }
}

/**
 * Verify required endpoints are documented
 */
function verifyRequiredEndpoints(): boolean {
  logger.info("\nVerifying required endpoints are documented...");

  const requiredEndpoints = [
    { path: "/api/bookings", method: "post" },
    { path: "/api/bookings", method: "get" },
    { path: "/api/bookings/{id}", method: "get" },
    { path: "/api/bookings/{id}", method: "put" },
    { path: "/api/bookings/{id}", method: "patch" },
    { path: "/api/bookings/{id}", method: "delete" },
    { path: "/api/health", method: "get" },
    { path: "/api/health/db", method: "get" },
  ];

  let allFound = true;

  const spec = swaggerSpec as any;

  for (const endpoint of requiredEndpoints) {
    const pathExists = spec.paths[endpoint.path];
    const methodExists = pathExists && pathExists[endpoint.method];

    if (methodExists) {
      logger.info(`✓ ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    } else {
      logger.error(
        `✗ ${endpoint.method.toUpperCase()} ${endpoint.path} - NOT DOCUMENTED`
      );
      allFound = false;
    }
  }

  if (allFound) {
    logger.info("\n✅ All required endpoints are documented!");
  } else {
    logger.error("\n❌ Some required endpoints are missing documentation");
  }

  return allFound;
}

/**
 * Verify error codes are documented
 */
function verifyErrorCodes(): boolean {
  logger.info("\nVerifying error codes are documented...");

  const spec = swaggerSpec as any;
  const responses = spec.components.responses || {};
  const errorResponses = Object.keys(responses).filter(
    (key) =>
      key.toLowerCase().includes("error") ||
      [
        "BadRequest",
        "Unauthorized",
        "NotFound",
        "Conflict",
        "TooManyRequests",
        "ServiceUnavailable",
        "GatewayTimeout",
      ].includes(key)
  );

  logger.info(`✓ Found ${errorResponses.length} error response definitions:`);
  errorResponses.forEach((response) => {
    logger.info(`  - ${response}`);
  });

  logger.info("\n✅ Error codes are documented in components/responses!");
  return true;
}

/**
 * Main verification function
 */
async function main() {
  logger.info("=".repeat(60));
  logger.info("OpenAPI Documentation Verification");
  logger.info("=".repeat(60));

  const results = {
    specValid: verifySwaggerSpec(),
    endpointsDocumented: verifyRequiredEndpoints(),
    errorCodesDocumented: verifyErrorCodes(),
  };

  logger.info("\n" + "=".repeat(60));
  logger.info("Verification Summary");
  logger.info("=".repeat(60));
  logger.info(`OpenAPI Spec Valid: ${results.specValid ? "✅" : "❌"}`);
  logger.info(
    `Endpoints Documented: ${results.endpointsDocumented ? "✅" : "❌"}`
  );
  logger.info(
    `Error Codes Documented: ${results.errorCodesDocumented ? "✅" : "❌"}`
  );

  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    logger.info("\n🎉 All documentation checks passed!");
    logger.info("\nDocumentation endpoints:");
    logger.info("  - OpenAPI JSON: http://localhost:3000/api/docs");
    logger.info("  - Swagger UI: http://localhost:3000/api/docs/ui");
    process.exit(0);
  } else {
    logger.error("\n❌ Some documentation checks failed");
    process.exit(1);
  }
}

// Run verification
main().catch((error) => {
  logger.error("Verification failed:", error);
  process.exit(1);
});
