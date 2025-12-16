# Retell SDK Usage Guide

## Overview

The Retell SDK has been successfully initialized in your backend application. This guide shows you how to use it.

## Configuration

The following environment variables are configured in `backend/.env`:

```env
RETELL_API_KEY=your_retell_api_key_hereb4db
RETELL_AGENT_ID=your_retell_agent_id_heredb
RETELL_LLM_ID=your_retell_llm_id_here12cd
RETELL_ENABLED=true
Custom_LLM_URL=https://your-ngrok-url.ngrok-free.app.ngrok.io/retell/llm
Agent_Level_Webhook_URL=https://your-ngrok-url.ngrok-free.app.ngrok.io/retell/webhook
```

## Service Location

The Retell SDK is wrapped in a service class located at:

- `backend/src/services/retell.service.ts`

## Available Methods

### 1. Create Web Call

```typescript
const response = await retellService.createWebCall(agentId, {
  sessionId: "unique-session-id",
  // any other metadata
});
// Returns: { call_id, access_token, ... }
```

### 2. Create Phone Call

```typescript
const response = await retellService.createPhoneCall({
  fromNumber: "+1234567890",
  toNumber: "+0987654321",
  agentId: "agent_xxx",
  metadata: {
    /* optional */
  },
});
```

### 3. Get Call Details

```typescript
const call = await retellService.getCall(callId);
```

### 4. List Recent Calls

```typescript
const calls = await retellService.listCalls(10); // limit to 10
```

### 5. Get Agent Details

```typescript
const agent = await retellService.getAgent(agentId);
```

### 6. Update Agent

```typescript
const updatedAgent = await retellService.updateAgent(agentId, {
  llm_websocket_url: "https://your-url.com/llm",
  agent_webhook_url: "https://your-url.com/webhook",
});
```

## API Endpoints

The following endpoints are available:

### POST /api/retell/register-call

Register a new call and get access token

```json
{
  "agentId": "agent_xxx",
  "sessionId": "optional-session-id"
}
```

### POST /api/retell/webhook

Handle Retell webhooks (called by Retell)

### POST /api/retell/llm

Handle custom LLM requests from Retell (called by Retell)

### GET /api/retell/health

Health check endpoint

## Controller Usage

The `RetellController` automatically initializes the `RetellService`:

```typescript
export class RetellController {
  private retellService: RetellService;

  constructor(private conversationService: ConversationService) {
    this.retellService = new RetellService();
  }
  // ... methods
}
```

## Testing

Run the initialization script to verify setup:

```bash
npm run init:retell
```

This will:

- ✓ Initialize the Retell SDK
- ✓ Verify API key is valid
- ✓ Fetch agent details
- ✓ Update agent with webhook URLs
- ✓ List recent calls

## Integration Points

1. **Web Call Registration**: Frontend calls `/api/retell/register-call` to get access token
2. **Custom LLM**: Retell calls your `/api/retell/llm` endpoint for AI responses
3. **Webhooks**: Retell sends events to `/api/retell/webhook` for call lifecycle events

## Next Steps

1. Test the web call flow from your frontend
2. Implement custom LLM logic in the conversation service
3. Handle webhook events for call analytics
4. Monitor logs for any issues

## Troubleshooting

- Check logs in `backend/logs/app.log`
- Verify ngrok tunnel is running for webhook URLs
- Ensure RETELL_API_KEY is valid
- Test endpoints using the health check endpoint
