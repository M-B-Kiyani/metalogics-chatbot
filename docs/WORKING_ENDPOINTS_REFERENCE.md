# Working Endpoints Reference - All Services & API Methods

## 🚀 Production Environment

- **Base URL**: `https://metalogics-chatbot-production.up.railway.app`
- **API Key**: `c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19`
- **Widget API Key**: `12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce`

---

## 📋 Table of Contents

1. [Root Endpoints](#root-endpoints)
2. [Health Check Service](#health-check-service)
3. [Available Slots Service](#available-slots-service)
4. [Booking Management Service](#booking-management-service)
5. [Chat/Conversation Service](#chatconversation-service)
6. [Retell Voice Service](#retell-voice-service)
7. [Widget Service](#widget-service)
8. [Testing Examples](#testing-examples)

---

## 🏠 Root Endpoints

### GET / - API Information

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/"
```

**Response:**

```json
{
  "success": true,
  "message": "Metalogics AI Assistant API",
  "version": "1.0.0",
  "timestamp": "2024-12-24T12:00:00.000Z",
  "endpoints": {
    "health": "/health",
    "api": "/api",
    "docs": "/api/docs"
  }
}
```

### GET /health - Basic Health Check

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/health"
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-12-24T12:00:00.000Z"
}
```

### OPTIONS / - CORS Preflight

```bash
curl -X OPTIONS "https://metalogics-chatbot-production.up.railway.app/" \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST"
```

---

## 🏥 Health Check Service

### GET /api/health - Overall Service Health

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/health"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "production",
    "timestamp": "2024-12-24T12:00:00.000Z"
  }
}
```

### GET /api/health/db - Database Health

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/health/db"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "responseTime": 45,
    "connections": {
      "active": 2,
      "idle": 18,
      "total": 20
    }
  }
}
```

### GET /api/health/calendar - Google Calendar Health

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/health/calendar"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "authenticated": true,
    "responseTime": 120,
    "calendarId": "fc806c32e360c7750a2af5e393286c2e39318b81a2b30bc99e8f333159c90930@group.calendar.google.com"
  }
}
```

### GET /api/health/crm - HubSpot CRM Health

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/health/crm"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "authenticated": true,
    "responseTime": 200
  }
}
```

---

## 📅 Available Slots Service

### GET /api/bookings/available-slots - Get Available Time Slots

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/bookings/available-slots?startDate=2024-12-25T00:00:00Z&endDate=2024-12-31T00:00:00Z&duration=30"
```

**Query Parameters:**

- `startDate` (required): ISO 8601 date-time
- `endDate` (required): ISO 8601 date-time (max 30 days from startDate)
- `duration` (required): 15, 30, 45, or 60 minutes

**Response:**

```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "startTime": "2024-12-25T09:00:00Z",
        "endTime": "2024-12-25T09:30:00Z",
        "duration": 30
      },
      {
        "startTime": "2024-12-25T10:00:00Z",
        "endTime": "2024-12-25T10:30:00Z",
        "duration": 30
      }
    ],
    "businessHours": {
      "daysOfWeek": [1, 2, 3, 4, 5],
      "startHour": 9,
      "endHour": 17,
      "timeZone": "Europe/London"
    }
  }
}
```

### GET /api/slots-simple - Simple Available Slots (No Auth)

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/slots-simple"
```

---

## 📝 Booking Management Service

### GET /api/bookings - List Bookings

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/bookings?page=1&limit=10"
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
- `dateFrom` (optional): ISO 8601 date-time
- `dateTo` (optional): ISO 8601 date-time
- `email` (optional): Filter by client email

**Response:**

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid-here",
        "clientName": "John Doe",
        "clientEmail": "john@example.com",
        "clientPhone": "+1234567890",
        "startTime": "2024-12-25T10:00:00Z",
        "endTime": "2024-12-25T10:30:00Z",
        "duration": 30,
        "status": "CONFIRMED",
        "inquiry": "Business consultation",
        "createdAt": "2024-12-24T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### POST /api/bookings - Create New Booking (Requires API Key)

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19" \
  -d '{
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "clientPhone": "+1234567890",
    "startTime": "2024-12-25T10:00:00Z",
    "endTime": "2024-12-25T10:30:00Z",
    "duration": 30,
    "inquiry": "Business consultation"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid-here",
      "clientName": "John Doe",
      "clientEmail": "john@example.com",
      "clientPhone": "+1234567890",
      "startTime": "2024-12-25T10:00:00Z",
      "endTime": "2024-12-25T10:30:00Z",
      "duration": 30,
      "status": "PENDING",
      "inquiry": "Business consultation",
      "createdAt": "2024-12-24T12:00:00Z"
    }
  }
}
```

### GET /api/bookings/{id} - Get Specific Booking

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/bookings/uuid-here"
```

### PUT /api/bookings/{id} - Update Booking (Requires API Key)

```bash
curl -X PUT "https://metalogics-chatbot-production.up.railway.app/api/bookings/uuid-here" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19" \
  -d '{
    "inquiry": "Updated business consultation details",
    "startTime": "2024-12-25T11:00:00Z",
    "endTime": "2024-12-25T11:30:00Z"
  }'
```

### PATCH /api/bookings/{id} - Update Booking Status (Requires API Key)

```bash
curl -X PATCH "https://metalogics-chatbot-production.up.railway.app/api/bookings/uuid-here" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19" \
  -d '{
    "status": "CONFIRMED"
  }'
```

### DELETE /api/bookings/{id} - Cancel Booking (Requires API Key)

```bash
curl -X DELETE "https://metalogics-chatbot-production.up.railway.app/api/bookings/uuid-here" \
  -H "Authorization: Bearer c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19"
```

---

## 💬 Chat/Conversation Service

### POST /api/chat - Send Chat Message

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I would like to book a consultation",
    "sessionId": "session-123"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "Hello! I'd be happy to help you book a consultation. What type of consultation are you looking for?",
    "sessionId": "session-123",
    "timestamp": "2024-12-24T12:00:00Z"
  }
}
```

### DELETE /api/chat/{sessionId} - Clear Chat Session

```bash
curl -X DELETE "https://metalogics-chatbot-production.up.railway.app/api/chat/session-123"
```

**Response:**

```json
{
  "success": true,
  "message": "Session cleared successfully"
}
```

---

## 🎤 Retell Voice Service

### GET /api/retell/health - Voice Service Health

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/retell/health"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "retellEnabled": true,
    "agentId": "agent_90b8518a5afdfa8047c6213bdb",
    "llmId": "llm_5067b1a3da909b45192ecac112cd"
  }
}
```

### POST /api/retell/register-call - Register Voice Call

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/retell/register-call" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_90b8518a5afdfa8047c6213bdb"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "call_id": "call-uuid-here",
    "access_token": "access-token-here",
    "agent_id": "agent_90b8518a5afdfa8047c6213bdb"
  }
}
```

### POST /api/retell/webhook - Handle Retell Webhooks

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/retell/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_started",
    "call_id": "call-uuid-here",
    "data": {}
  }'
```

### POST /api/retell/llm - Handle Custom LLM Requests

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/retell/llm" \
  -H "Content-Type: application/json" \
  -d '{
    "response_id": 1,
    "transcript": [
      {
        "role": "user",
        "content": "I want to book an appointment"
      }
    ]
  }'
```

### POST /api/retell/execute-function - Execute Voice Functions

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/retell/execute-function" \
  -H "Content-Type: application/json" \
  -d '{
    "function_name": "book_appointment",
    "arguments": {
      "date": "2024-12-25",
      "time": "10:00",
      "duration": 30
    }
  }'
```

---

## 🎯 Widget Service (Requires Widget API Key)

### POST /api/widget/chat - Widget Chat Message

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/widget/chat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce" \
  -d '{
    "message": "Hello from widget",
    "sessionId": "widget-session-123"
  }'
```

### GET /api/widget/retell/health - Widget Voice Health

```bash
curl -X GET "https://metalogics-chatbot-production.up.railway.app/api/widget/retell/health" \
  -H "x-api-key: 12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce"
```

### POST /api/widget/retell/register-call - Widget Voice Registration

```bash
curl -X POST "https://metalogics-chatbot-production.up.railway.app/api/widget/retell/register-call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: 12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce" \
  -d '{
    "agent_id": "agent_90b8518a5afdfa8047c6213bdb"
  }'
```

---

## 🧪 Testing Examples

### JavaScript/Node.js Example

```javascript
const axios = require("axios");

const BASE_URL = "https://metalogics-chatbot-production.up.railway.app";
const API_KEY =
  "c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19";
const WIDGET_API_KEY = "12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce";

// Test health endpoint
async function testHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log("Health:", response.data);
  } catch (error) {
    console.error(
      "Health check failed:",
      error.response?.data || error.message
    );
  }
}

// Test available slots
async function testAvailableSlots() {
  try {
    const params = {
      startDate: "2024-12-25T00:00:00Z",
      endDate: "2024-12-31T00:00:00Z",
      duration: 30,
    };

    const response = await axios.get(
      `${BASE_URL}/api/bookings/available-slots`,
      { params }
    );
    console.log("Available slots:", response.data);
  } catch (error) {
    console.error(
      "Available slots failed:",
      error.response?.data || error.message
    );
  }
}

// Test create booking
async function testCreateBooking() {
  try {
    const bookingData = {
      clientName: "Test User",
      clientEmail: "test@example.com",
      clientPhone: "+1234567890",
      startTime: "2024-12-25T10:00:00Z",
      endTime: "2024-12-25T10:30:00Z",
      duration: 30,
      inquiry: "Test booking via API",
    };

    const response = await axios.post(`${BASE_URL}/api/bookings`, bookingData, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Booking created:", response.data);
    return response.data.data.booking.id;
  } catch (error) {
    console.error(
      "Create booking failed:",
      error.response?.data || error.message
    );
  }
}

// Test chat
async function testChat() {
  try {
    const chatData = {
      message: "Hello, I want to book a consultation",
      sessionId: "test-session-123",
    };

    const response = await axios.post(`${BASE_URL}/api/chat`, chatData, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Chat response:", response.data);
  } catch (error) {
    console.error("Chat failed:", error.response?.data || error.message);
  }
}

// Test widget chat
async function testWidgetChat() {
  try {
    const chatData = {
      message: "Hello from widget test",
      sessionId: "widget-test-session-123",
    };

    const response = await axios.post(`${BASE_URL}/api/widget/chat`, chatData, {
      headers: {
        "x-api-key": WIDGET_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("Widget chat response:", response.data);
  } catch (error) {
    console.error("Widget chat failed:", error.response?.data || error.message);
  }
}

// Run all tests
async function runTests() {
  console.log("🚀 Testing all endpoints...\n");

  await testHealth();
  await testAvailableSlots();
  await testCreateBooking();
  await testChat();
  await testWidgetChat();

  console.log("\n✅ All tests completed!");
}

runTests();
```

### Python Example

```python
import requests
import json

BASE_URL = 'https://metalogics-chatbot-production.up.railway.app'
API_KEY = 'c37914b47420e9bbf2c30e9f8d2f5efd435a8086b8841073972559a084c20d19'
WIDGET_API_KEY = '12cc3551cb0bf1665f8ca67060bb9e23c57ebe1e5c7d3bce'

def test_health():
    response = requests.get(f'{BASE_URL}/api/health')
    print('Health:', response.json())

def test_available_slots():
    params = {
        'startDate': '2024-12-25T00:00:00Z',
        'endDate': '2024-12-31T00:00:00Z',
        'duration': 30
    }
    response = requests.get(f'{BASE_URL}/api/bookings/available-slots', params=params)
    print('Available slots:', response.json())

def test_create_booking():
    booking_data = {
        'clientName': 'Test User',
        'clientEmail': 'test@example.com',
        'clientPhone': '+1234567890',
        'startTime': '2024-12-25T10:00:00Z',
        'endTime': '2024-12-25T10:30:00Z',
        'duration': 30,
        'inquiry': 'Test booking via Python API'
    }

    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    response = requests.post(f'{BASE_URL}/api/bookings', json=booking_data, headers=headers)
    print('Booking created:', response.json())

def test_chat():
    chat_data = {
        'message': 'Hello, I want to book a consultation',
        'sessionId': 'python-test-session-123'
    }

    headers = {'Content-Type': 'application/json'}
    response = requests.post(f'{BASE_URL}/api/chat', json=chat_data, headers=headers)
    print('Chat response:', response.json())

if __name__ == '__main__':
    print('🚀 Testing all endpoints...\n')

    test_health()
    test_available_slots()
    test_create_booking()
    test_chat()

    print('\n✅ All tests completed!')
```

---

## 📊 HTTP Methods Summary

| Service    | Endpoint      | GET | POST | PUT | PATCH | DELETE | OPTIONS |
| ---------- | ------------- | --- | ---- | --- | ----- | ------ | ------- |
| **Root**   | `/`           | ✅  | ❌   | ❌  | ❌    | ❌     | ✅      |
| **Root**   | `/health`     | ✅  | ❌   | ❌  | ❌    | ❌     | ✅      |
| **Health** | `/api/health` | ✅  |
