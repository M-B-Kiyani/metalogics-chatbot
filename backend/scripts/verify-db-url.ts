
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../.env') });

const urlString = process.env.DATABASE_URL;

if (!urlString) {
  console.error("❌ DATABASE_URL is not defined in .env");
  process.exit(1);
}

try {
  // Try to clean quotes if present (common issue)
  const cleanUrl = urlString.replace(/^["']|["']$/g, '');
  
  const parsed = new URL(cleanUrl);
  console.log("✅ DATABASE_URL Parsed Successfully:");
  console.log(`   Protocol: ${parsed.protocol}`);
  console.log(`   Host: ${parsed.hostname}`);
  console.log(`   Port: '${parsed.port}' (Length: ${parsed.port.length})`);
  console.log(`   Path: ${parsed.pathname}`);
  console.log(`   Query: ${parsed.search}`);
  
  if (!parsed.port) {
    console.error("❌ ERROR: Port is missing from the URL!");
  } else if (isNaN(parseInt(parsed.port))) {
    console.error(`❌ ERROR: Port '${parsed.port}' is not a number!`);
  } else {
    console.log("✅ Port looks valid.");
  }

} catch (error) {
  console.error("❌ Failed to parse DATABASE_URL:");
  console.error((error as any).message);
  console.log("Raw URL (masked):", urlString.replace(/:[^:@]*@/, ':****@'));
}
