const fetch = require("node-fetch");

async function testRegisterCall() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/retell/register-call",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: "your_retell_agent_id_heredb",
          sessionId: `test-${Date.now()}`,
        }),
      }
    );

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Error response:", data);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
  }
}

testRegisterCall();
