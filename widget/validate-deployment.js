#!/usr/bin/env node

/**
 * Widget Deployment Validation Script
 * Tests if the widget is properly deployed and accessible
 */

const https = require("https");
const http = require("http");

const WIDGET_URL = process.env.WIDGET_URL || "http://localhost:3000";

async function validateDeployment() {
  console.log("🔍 Validating widget deployment...");
  console.log(`📍 Widget URL: ${WIDGET_URL}`);

  const tests = [
    {
      name: "Widget JS File",
      path: "/metalogics-chatbot.iife.js",
      expectedContent: "MetalogicsChatbot",
    },
    {
      name: "Widget CSS File",
      path: "/metalogics-chatbot.css",
      expectedContent: "chatbot",
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      const url = `${WIDGET_URL}${test.path}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.log(`❌ ${test.name}: HTTP ${response.status}`);
        allPassed = false;
        continue;
      }

      const content = await response.text();

      if (test.expectedContent && !content.includes(test.expectedContent)) {
        console.log(`❌ ${test.name}: Content validation failed`);
        allPassed = false;
        continue;
      }

      console.log(`✅ ${test.name}: OK (${content.length} bytes)`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      allPassed = false;
    }
  }

  console.log("\n" + "=".repeat(50));

  if (allPassed) {
    console.log("🎉 All tests passed! Widget deployment is successful.");
    process.exit(0);
  } else {
    console.log("💥 Some tests failed. Check the deployment.");
    process.exit(1);
  }
}

// Polyfill fetch for older Node versions
if (typeof fetch === "undefined") {
  global.fetch = async (url) => {
    return new Promise((resolve, reject) => {
      const client = url.startsWith("https:") ? https : http;

      client
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              text: () => Promise.resolve(data),
            });
          });
        })
        .on("error", reject);
    });
  };
}

validateDeployment().catch(console.error);
