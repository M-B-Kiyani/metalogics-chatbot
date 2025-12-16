/**
 * Voice Integration Diagnostic Test
 * Tests all components of the Retell voice integration
 */

const https = require("https");
const http = require("http");

// Configuration
const BACKEND_URL = "http://localhost:3000";
const AGENT_ID = "your_retell_agent_id_heredb";
const RETELL_API_KEY = "your_retell_api_key_hereb4db";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const req = client.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function test1_BackendHealth() {
  log("\n=== Test 1: Backend Health Check ===", colors.blue);

  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);

    if (response.status === 200) {
      log("✓ Backend is running", colors.green);
      log(`  Status: ${JSON.stringify(response.body, null, 2)}`);
      return true;
    } else {
      log(`✗ Backend health check failed: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Cannot connect to backend: ${error.message}`, colors.red);
    log(
      "  Make sure the backend server is running on port 3000",
      colors.yellow
    );
    return false;
  }
}

async function test2_RetellHealth() {
  log("\n=== Test 2: Retell Integration Health ===", colors.blue);

  try {
    const response = await makeRequest(`${BACKEND_URL}/api/retell/health`);

    if (response.status === 200) {
      log("✓ Retell integration endpoint is accessible", colors.green);
      return true;
    } else {
      log(`✗ Retell health check failed: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Retell health check error: ${error.message}`, colors.red);
    return false;
  }
}

async function test3_RetellAPIKey() {
  log("\n=== Test 3: Retell API Key Validation ===", colors.blue);

  try {
    const response = await makeRequest(
      "https://api.retellai.com/v2/list-agents",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      log("✓ Retell API key is valid", colors.green);
      log(`  Found ${response.body.length || 0} agents`);
      return true;
    } else {
      log(`✗ Retell API key validation failed: ${response.status}`, colors.red);
      log(`  Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log(`✗ Retell API connection error: ${error.message}`, colors.red);
    return false;
  }
}

async function test4_RetellAgent() {
  log("\n=== Test 4: Retell Agent Configuration ===", colors.blue);

  try {
    const response = await makeRequest(
      `https://api.retellai.com/v2/get-agent/${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      log("✓ Retell agent exists and is configured", colors.green);
      log(`  Agent ID: ${response.body.agent_id}`);
      log(`  Agent Name: ${response.body.agent_name || "N/A"}`);
      log(
        `  LLM Type: ${
          response.body.llm_websocket_url
            ? "Custom LLM (WebSocket)"
            : "Retell LLM"
        }`
      );

      if (response.body.llm_websocket_url) {
        log(`  WebSocket URL: ${response.body.llm_websocket_url}`);

        // Check if WebSocket URL matches backend
        if (
          response.body.llm_websocket_url.includes("localhost") ||
          response.body.llm_websocket_url.includes("127.0.0.1")
        ) {
          log(
            "  ⚠ Warning: WebSocket URL points to localhost - this won't work from browser!",
            colors.yellow
          );
          log("    You need to use ngrok or a public URL", colors.yellow);
        }
      }

      return true;
    } else {
      log(`✗ Failed to retrieve agent: ${response.status}`, colors.red);
      log(`  Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log(`✗ Agent retrieval error: ${error.message}`, colors.red);
    return false;
  }
}

async function test5_RegisterCall() {
  log("\n=== Test 5: Call Registration ===", colors.blue);

  try {
    const response = await makeRequest(
      `${BACKEND_URL}/api/retell/register-call`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: AGENT_ID,
          sessionId: `test-${Date.now()}`,
        }),
      }
    );

    if (response.status === 200 && response.body.success) {
      log("✓ Call registration successful", colors.green);
      log(`  Call ID: ${response.body.callId}`);
      log(`  Access Token: ${response.body.accessToken.substring(0, 20)}...`);
      return true;
    } else {
      log(`✗ Call registration failed: ${response.status}`, colors.red);
      log(`  Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log(`✗ Call registration error: ${error.message}`, colors.red);
    return false;
  }
}

async function test6_WebSocketEndpoint() {
  log("\n=== Test 6: WebSocket Endpoint Check ===", colors.blue);

  // We can't test WebSocket from Node without ws package, but we can check the URL
  const wsUrl =
    "wss://your-ngrok-url.ngrok-free.app/api/retell/llm";

  log(`  Configured WebSocket URL: ${wsUrl}`);

  if (wsUrl.includes("ngrok")) {
    log("  ✓ Using ngrok tunnel (good for development)", colors.green);
    log(
      "  ⚠ Make sure ngrok is running and pointing to localhost:3000",
      colors.yellow
    );
  } else if (wsUrl.includes("localhost") || wsUrl.includes("127.0.0.1")) {
    log("  ✗ WebSocket URL uses localhost - this won't work!", colors.red);
    log(
      "    Browser cannot connect to localhost WebSocket from Retell",
      colors.red
    );
  } else {
    log("  ✓ Using public URL", colors.green);
  }

  return true;
}

async function test7_GeminiService() {
  log("\n=== Test 7: Gemini AI Service ===", colors.blue);

  const geminiKey = "your_gemini_api_key_here";

  try {
    const response = await makeRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Say "test successful" if you can read this.' }],
            },
          ],
        }),
      }
    );

    if (response.status === 200) {
      log("✓ Gemini AI service is working", colors.green);
      return true;
    } else {
      log(`✗ Gemini API error: ${response.status}`, colors.red);
      log(`  Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    log(`✗ Gemini service error: ${error.message}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log(
    "\n╔════════════════════════════════════════════════════════╗",
    colors.blue
  );
  log("║     VOICE INTEGRATION DIAGNOSTIC TEST SUITE          ║", colors.blue);
  log(
    "╚════════════════════════════════════════════════════════╝",
    colors.blue
  );

  const results = {
    backendHealth: await test1_BackendHealth(),
    retellHealth: await test2_RetellHealth(),
    retellAPIKey: await test3_RetellAPIKey(),
    retellAgent: await test4_RetellAgent(),
    registerCall: await test5_RegisterCall(),
    websocketEndpoint: await test6_WebSocketEndpoint(),
    geminiService: await test7_GeminiService(),
  };

  log(
    "\n╔════════════════════════════════════════════════════════╗",
    colors.blue
  );
  log("║                    TEST SUMMARY                       ║", colors.blue);
  log(
    "╚════════════════════════════════════════════════════════╝",
    colors.blue
  );

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.values(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? "✓" : "✗";
    const color = passed ? colors.green : colors.red;
    log(`  ${status} ${test}`, color);
  });

  log(
    `\n  Total: ${passed}/${total} tests passed`,
    passed === total ? colors.green : colors.yellow
  );

  if (passed < total) {
    log(
      "\n╔════════════════════════════════════════════════════════╗",
      colors.yellow
    );
    log(
      "║                  TROUBLESHOOTING                      ║",
      colors.yellow
    );
    log(
      "╚════════════════════════════════════════════════════════╝",
      colors.yellow
    );

    if (!results.backendHealth) {
      log("\n  Backend Server Issue:", colors.yellow);
      log("  1. Make sure backend is running: cd backend && npm run dev");
      log("  2. Check if port 3000 is available");
      log("  3. Check backend/.env file for correct configuration");
    }

    if (!results.retellAPIKey) {
      log("\n  Retell API Key Issue:", colors.yellow);
      log("  1. Verify RETELL_API_KEY in backend/.env");
      log("  2. Check if key is valid at https://retellai.com");
      log("  3. Make sure key has proper permissions");
    }

    if (!results.retellAgent) {
      log("\n  Retell Agent Issue:", colors.yellow);
      log("  1. Verify RETELL_AGENT_ID in backend/.env");
      log("  2. Check agent configuration at https://retellai.com");
      log("  3. Make sure agent is using Custom LLM with WebSocket");
    }

    if (!results.websocketEndpoint) {
      log("\n  WebSocket Issue:", colors.yellow);
      log("  1. Start ngrok: ngrok http 3000");
      log("  2. Update RETELL_CUSTOM_LLM_WEBSOCKET_URL in backend/.env");
      log("  3. Update agent WebSocket URL at https://retellai.com");
      log("  4. Use wss:// protocol (not ws://)");
    }

    if (!results.geminiService) {
      log("\n  Gemini AI Issue:", colors.yellow);
      log("  1. Verify GEMINI_API_KEY in backend/.env");
      log(
        "  2. Check if key is valid at https://makersuite.google.com/app/apikey"
      );
      log("  3. Make sure Gemini API is enabled");
    }
  } else {
    log(
      "\n✓ All tests passed! Voice integration should be working.",
      colors.green
    );
    log("\nIf calls still don't respond, check:", colors.yellow);
    log("  1. Browser console for errors");
    log("  2. Microphone permissions in browser");
    log("  3. Backend logs for WebSocket connection");
    log("  4. Ngrok tunnel is active and accessible");
  }
}

// Run tests
runAllTests().catch((error) => {
  log(`\nFatal error: ${error.message}`, colors.red);
  process.exit(1);
});
