/**
 * Debug Agent Response - Show full JSON
 */

const https = require("https");

const RETELL_API_KEY = "your_retell_api_key_hereb4db";
const AGENT_ID = "your_retell_agent_id_heredb";

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const response = await makeRequest(
    `https://api.retellai.com/get-agent/${AGENT_ID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("\n=== FULL AGENT RESPONSE ===\n");
  console.log(JSON.stringify(response.body, null, 2));
}

main().catch(console.error);
