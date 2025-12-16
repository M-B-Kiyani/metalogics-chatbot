/**
 * Comprehensive Component Test
 * Tests all parts of the system to verify everything is working
 */

import axios from "axios";
import { config } from "../src/config";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || config.auth.apiKey;

interface TestResult {
  component: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️  WARN";
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testComponent(
  component: string,
  testFn: () => Promise<{
    status: "✅ PASS" | "❌ FAIL" | "⚠️  WARN";
    message: string;
    details?: any;
  }>
) {
  try {
    const result = await testFn();
    results.push({ component, ...result });
    console.log(`${result.status} ${component}: ${result.message}`);
    if (result.details) {
      console.log(`   ${JSON.stringify(result.details, null, 2)}`);
    }
  } catch (error: any) {
    results.push({
      component,
      status: "❌ FAIL",
      message: error.message || String(error),
    });
    console.log(`❌ FAIL ${component}: ${error.message || String(error)}`);
  }
}

async function main() {
  console.log("=".repeat(80));
  console.log("METALOGICS AI ASSISTANT - COMPREHENSIVE COMPONENT TEST");
  console.log("=".repeat(80));
  console.log();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  // 1. Backend API Health
  await testComponent("Backend API", async () => {
    const response = await apiClient.get("/api/health");
    if (response.status === 200 && response.data.status === "healthy") {
      return {
        status: "✅ PASS",
        message: `API is healthy (uptime: ${Math.floor(
          response.data.uptime / 1000
        )}s)`,
        details: { version: response.data.version, cache: response.data.cache },
      };
    }
    return { status: "❌ FAIL", message: "API health check failed" };
  });

  // 2. Database Connection
  await testComponent("Database", async () => {
    try {
      const response = await apiClient.get("/api/bookings", {
        params: { page: 1, limit: 1 },
      });
      if (response.status === 200) {
        return {
          status: "✅ PASS",
          message: "Database connection successful",
          details: { totalBookings: response.data.data.total },
        };
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 503) {
        return { status: "❌ FAIL", message: "Database connection failed" };
      }
    }
    return { status: "❌ FAIL", message: "Database test failed" };
  });

  // 3. Google Calendar Integration
  await testComponent("Google Calendar", async () => {
    const response = await apiClient.get("/api/health/calendar");
    if (response.status === 200) {
      const data = response.data;
      if (data.status === "healthy" && data.authenticated) {
        return {
          status: "✅ PASS",
          message: `Calendar integration working (${data.responseTime}ms)`,
          details: {
            calendarId: data.calendarId,
            circuitBreaker: data.circuitBreaker.state,
          },
        };
      } else if (!config.googleCalendar.enabled) {
        return { status: "⚠️  WARN", message: "Calendar integration disabled" };
      }
      return { status: "❌ FAIL", message: "Calendar not authenticated" };
    }
    return { status: "❌ FAIL", message: "Calendar health check failed" };
  });

  // 4. HubSpot CRM Integration
  await testComponent("HubSpot CRM", async () => {
    const response = await apiClient.get("/api/health/crm");
    if (response.status === 200) {
      const data = response.data;
      if (data.status === "healthy" && data.authenticated) {
        return {
          status: "✅ PASS",
          message: `CRM integration working (${data.responseTime}ms)`,
          details: { circuitBreaker: data.circuitBreaker.state },
        };
      } else if (!config.hubspot.enabled) {
        return { status: "⚠️  WARN", message: "CRM integration disabled" };
      }
      return { status: "❌ FAIL", message: "CRM not authenticated" };
    }
    return { status: "❌ FAIL", message: "CRM health check failed" };
  });

  // 5. Available Slots API
  await testComponent("Available Slots API", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const response = await apiClient.get("/api/bookings/available-slots", {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: 30,
      },
    });

    if (response.status === 200 && response.data.success) {
      const slots = response.data.data.slots;
      return {
        status: "✅ PASS",
        message: `Found ${slots.length} available slots`,
        details: {
          firstSlot: slots[0]?.startTime,
          lastSlot: slots[slots.length - 1]?.startTime,
        },
      };
    }
    return { status: "❌ FAIL", message: "Failed to fetch available slots" };
  });

  // 6. Booking Creation (with unique slot)
  await testComponent("Booking Creation", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const slotsResponse = await apiClient.get("/api/bookings/available-slots", {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: 30,
      },
    });

    const slots = slotsResponse.data.data.slots;
    if (slots.length === 0) {
      return {
        status: "⚠️  WARN",
        message: "No available slots to test booking",
      };
    }

    // Try to find a slot that's not the first one (to avoid conflicts)
    const slot = slots[Math.min(5, slots.length - 1)];

    const bookingData = {
      name: "Component Test User",
      company: "Component Test Co",
      email: `component-test-${Date.now()}@metalogics.io`,
      phone: "+1234567890",
      inquiry: "Component test booking - please ignore",
      timeSlot: {
        startTime: slot.startTime,
        duration: 30,
      },
    };

    try {
      const response = await apiClient.post("/api/bookings", bookingData);
      if (response.status === 201 && response.data.success) {
        const bookingId = response.data.data.id;

        // Wait for integrations
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Check booking status
        const checkResponse = await apiClient.get(`/api/bookings/${bookingId}`);
        const booking = checkResponse.data.data;

        // Clean up
        await apiClient.delete(`/api/bookings/${bookingId}`);

        return {
          status: "✅ PASS",
          message: "Booking created and verified successfully",
          details: {
            bookingId,
            calendarSynced: booking.calendarSynced,
            crmSynced: booking.crmSynced,
            emailSent: booking.confirmationSent,
          },
        };
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        return {
          status: "⚠️  WARN",
          message: "Slot conflict (expected in active system)",
        };
      }
      throw error;
    }
    return { status: "❌ FAIL", message: "Booking creation failed" };
  });

  // 7. Email Configuration
  await testComponent("Email Configuration", async () => {
    if (config.email.smtpHost && config.email.smtpUser) {
      return {
        status: "✅ PASS",
        message: "Email configuration present",
        details: {
          host: config.email.smtpHost,
          from: config.email.fromEmail,
        },
      };
    }
    return { status: "⚠️  WARN", message: "Email configuration incomplete" };
  });

  // 8. Authentication
  await testComponent("API Authentication", async () => {
    const unauthorizedClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    try {
      await unauthorizedClient.post("/api/bookings", {
        name: "Test",
        company: "Test",
        email: "test@test.com",
        inquiry: "Test",
        timeSlot: { startTime: new Date().toISOString(), duration: 30 },
      });
      return { status: "❌ FAIL", message: "Authentication not enforced" };
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return {
          status: "✅ PASS",
          message: "Authentication properly enforced",
        };
      }
    }
    return { status: "❌ FAIL", message: "Authentication test failed" };
  });

  // 9. Rate Limiting
  await testComponent("Rate Limiting", async () => {
    const requests = [];
    for (let i = 0; i < 120; i++) {
      requests.push(
        apiClient.get("/api/health").catch((error) => {
          if (axios.isAxiosError(error)) {
            return error.response?.status;
          }
          return 0;
        })
      );
    }

    const results = await Promise.all(requests);
    const rateLimited = results.filter((r) => r === 429).length;

    if (rateLimited > 0) {
      return {
        status: "✅ PASS",
        message: `Rate limiting active (${rateLimited} requests blocked)`,
      };
    }
    return {
      status: "⚠️  WARN",
      message: "Rate limiting not detected (may be disabled)",
    };
  });

  // 10. Widget Build
  await testComponent("Widget Build", async () => {
    const fs = require("fs");
    const path = require("path");

    const widgetPath = path.join(
      __dirname,
      "../../widget/dist/metalogics-chatbot.iife.js"
    );
    const cssPath = path.join(
      __dirname,
      "../../widget/dist/metalogics-chatbot.css"
    );

    if (fs.existsSync(widgetPath) && fs.existsSync(cssPath)) {
      const stats = fs.statSync(widgetPath);
      return {
        status: "✅ PASS",
        message: "Widget build files present",
        details: { size: `${(stats.size / 1024).toFixed(2)} KB` },
      };
    }
    return { status: "❌ FAIL", message: "Widget build files not found" };
  });

  // Print Summary
  console.log();
  console.log("=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80));

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;
  const warnings = results.filter((r) => r.status === "⚠️  WARN").length;

  console.log(`Total Components: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);

  const passRate = ((passed / results.length) * 100).toFixed(1);
  console.log(`\nPass Rate: ${passRate}%`);

  if (failed > 0) {
    console.log("\n⚠️  Some components failed. Check the details above.");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n✅ All critical components working. Some warnings present.");
    process.exit(0);
  } else {
    console.log("\n✅ All components working perfectly!");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
