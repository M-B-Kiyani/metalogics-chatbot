#!/usr/bin/env node

/**
 * Simple test for available slots endpoint
 */

const https = require("https");

const BACKEND_URL = "https://metalogics-chatbot-production.up.railway.app";

console.log("🧪 Testing Available Slots Endpoint\n");

async function testAvailableSlots() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Tomorrow

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // Next week

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    duration: "30",
  });

  const url = `${BACKEND_URL}/api/bookings/available-slots?${params}`;
  console.log(`Testing: ${url}\n`);

  const startTime = Date.now();

  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: "GET",
        timeout: 12000, // 12 second timeout
      },
      (res) => {
        const duration = Date.now() - startTime;
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response time: ${duration}ms`);
        console.log(`Headers:`, res.headers);

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              console.log(
                `✅ Success! Found ${
                  parsed.data?.slots?.length || 0
                } available slots`
              );
              console.log(`Business hours:`, parsed.data?.businessHours);

              if (parsed.data?.slots?.length > 0) {
                console.log(`First few slots:`);
                parsed.data.slots.slice(0, 3).forEach((slot, i) => {
                  console.log(
                    `  ${i + 1}. ${slot.startTime} - ${slot.endTime} (${
                      slot.duration
                    }min)`
                  );
                });
              }
            } catch (e) {
              console.log(
                `✅ Success but couldn't parse JSON:`,
                data.substring(0, 200)
              );
            }
          } else {
            console.log(`❌ Error response:`, data.substring(0, 500));
          }
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      const duration = Date.now() - startTime;
      console.log(`❌ Request failed after ${duration}ms:`, err.message);
      resolve();
    });

    req.on("timeout", () => {
      const duration = Date.now() - startTime;
      console.log(`⏱️ Request timed out after ${duration}ms`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

testAvailableSlots().catch(console.error);
