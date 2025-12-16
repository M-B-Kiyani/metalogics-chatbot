/**
 * Schema Validation Script
 * Validates that the Prisma schema matches the migration files
 */

const fs = require("fs");
const path = require("path");

console.log("==========================================");
console.log("Schema Validation Script");
console.log("==========================================\n");

// Read schema file
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const schemaContent = fs.readFileSync(schemaPath, "utf8");

// Read migration file
const migrationPath = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20241118000000_add_integration_fields",
  "migration.sql"
);
const migrationContent = fs.readFileSync(migrationPath, "utf8");

// Fields to check
const requiredFields = [
  "calendarEventId",
  "crmContactId",
  "calendarSynced",
  "crmSynced",
  "requiresManualCalendarSync",
  "requiresManualCrmSync",
];

// Indexes to check
const requiredIndexes = ["calendarEventId", "crmContactId", "email, createdAt"];

let allValid = true;

// Check fields in schema
console.log("Checking fields in schema.prisma...");
requiredFields.forEach((field) => {
  if (schemaContent.includes(field)) {
    console.log(`  ✓ ${field}`);
  } else {
    console.log(`  ✗ ${field} - MISSING`);
    allValid = false;
  }
});

console.log("\nChecking fields in migration.sql...");
requiredFields.forEach((field) => {
  if (migrationContent.includes(field)) {
    console.log(`  ✓ ${field}`);
  } else {
    console.log(`  ✗ ${field} - MISSING`);
    allValid = false;
  }
});

console.log("\nChecking indexes in schema.prisma...");
requiredIndexes.forEach((index) => {
  const indexPattern = index.replace(", ", ",\\s*");
  const regex = new RegExp(`@@index\\(\\[${indexPattern}\\]\\)`);
  if (regex.test(schemaContent)) {
    console.log(`  ✓ [${index}]`);
  } else {
    console.log(`  ✗ [${index}] - MISSING`);
    allValid = false;
  }
});

console.log("\nChecking indexes in migration.sql...");
requiredIndexes.forEach((index) => {
  // For composite indexes, check if both columns are in the same index
  if (index.includes(",")) {
    const columns = index.split(",").map((c) => c.trim());
    const indexPattern = columns.join(".*");
    const regex = new RegExp(`CREATE INDEX.*\\(.*${indexPattern}.*\\)`);
    if (regex.test(migrationContent)) {
      console.log(`  ✓ [${index}]`);
    } else {
      console.log(`  ✗ [${index}] - MISSING`);
      allValid = false;
    }
  } else {
    if (migrationContent.includes(`"${index}"`)) {
      console.log(`  ✓ [${index}]`);
    } else {
      console.log(`  ✗ [${index}] - MISSING`);
      allValid = false;
    }
  }
});

console.log("\n==========================================");
if (allValid) {
  console.log("✅ Schema validation PASSED");
  console.log("==========================================\n");
  console.log("Schema and migration are in sync.");
  process.exit(0);
} else {
  console.log("❌ Schema validation FAILED");
  console.log("==========================================\n");
  console.log("Schema and migration are out of sync.");
  process.exit(1);
}
