


const API_BASE_URL = "http://localhost:3000";

async function testExecuteFunction() {
  console.log("Testing /api/retell/execute-function...");

  const payload = {
    name: "check_availability",
    args: {
      date: "2023-10-27"
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/retell/execute-function`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (response.status === 200) {
      console.log("✅ Endpoint working correctly");
    } else {
      console.log("❌ Endpoint failed");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testExecuteFunction();
