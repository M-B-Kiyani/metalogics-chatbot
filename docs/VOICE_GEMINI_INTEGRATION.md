# Voice-to-Gemini Integration Guide

This document explains how voice transcripts from Retell AI are connected to your Gemini chatbot for intelligent, context-aware voice conversations.

## Overview

The integration creates a seamless flow where:

1. User speaks via Retell voice interface
2. Speech is transcribed in real-time
3. Transcripts are sent to Gemini for intelligent response generation
4. Gemini's response is converted to speech and played back
5. All conversations are synced with the text chat interface

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  VoiceButton     │              │  Text Chat       │        │
│  │  - Microphone    │              │  - Message input │        │
│  │  - Call control  │              │  - Chat history  │        │
│  └──────────────────┘              └──────────────────┘        │
│           │                                  │                   │
│           │                                  │                   │
└───────────┼──────────────────────────────────┼───────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Retell AI Service                          │
│  - Speech-to-Text (STT)                                         │
│  - Text-to-Speech (TTS)                                         │
│  - Real-time audio streaming                                    │
└─────────────────────────────────────────────────────────────────┘
            │
            │ WebSocket (wss://)
            │ Real-time bidirectional
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  WebSocket Handler (/api/retell/llm)                     │ │
│  │  - Receives transcripts                                   │ │
│  │  - Manages conversation state                             │ │
│  │  - Streams responses back                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Retell LLM Service                                       │ │
│  │  - Message routing                                        │ │
│  │  - Session management                                     │ │
│  │  - Error handling                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Gemini Service                                           │ │
│  │  - AI response generation                                 │ │
│  │  - Context management                                     │ │
│  │  - Streaming support                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Google Gemini API                                        │ │
│  │  - Natural language understanding                         │ │
│  │  - Intelligent response generation                        │ │
│  │  - Context-aware conversations                            │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Message Flow

### 1. Voice Call Initiation

```typescript
// Frontend: VoiceButton.tsx
const startCall = async () => {
  // 1. Register call with backend
  const response = await fetch("/api/retell/register-call", {
    method: "POST",
    body: JSON.stringify({ agentId, sessionId }),
  });

  // 2. Get access token
  const { accessToken } = await response.json();

  // 3. Start Retell call
  await retellClient.startCall({ accessToken });
};
```

### 2. WebSocket Connection

```typescript
// Backend: server.ts
wss.on("connection", (ws, req) => {
  if (pathname === "/api/retell/llm") {
    retellLLMService.handleConnection(ws, callId);
  }
});
```

### 3. Real-time Transcript Processing

```typescript
// Backend: retell-llm.service.ts
ws.on("message", async (data) => {
  const message = JSON.parse(data);

  switch (message.interaction_type) {
    case "response_required":
      // User spoke, generate response
      const stream = await geminiService.sendMessageStream(
        sessionId,
        userMessage
      );

      // Stream response back to Retell
      for await (const chunk of stream) {
        ws.send(
          JSON.stringify({
            response_type: "response",
            content: chunk,
            content_complete: false,
          })
        );
      }
      break;
  }
});
```

### 4. Frontend Transcript Sync

```typescript
// Frontend: Chatbot.tsx
const handleVoiceTranscript = async (transcript, role) => {
  // Add to chat UI
  setMessages((prev) => [
    ...prev,
    {
      role: role === "user" ? Role.USER : Role.MODEL,
      text: transcript,
      source: "voice",
    },
  ]);

  // Sync with Gemini for context continuity
  if (role === "user" && chat) {
    await chat.sendMessage({ message: transcript });
  }
};
```

## Configuration

### Environment Variables

**Backend (`backend/.env`):**

```env
# Retell AI Configuration
RETELL_API_KEY=your-retell-api-key
RETELL_AGENT_ID=your-agent-id
RETELL_ENABLED=true
RETELL_CUSTOM_LLM_WEBSOCKET_URL=wss://your-domain.com/api/retell/llm

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend (`.env`):**

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Gemini Configuration (for text chat)
VITE_GOOGLE_API_KEY=your-gemini-api-key
```

### Retell Agent Configuration

Configure your Retell agent to use the custom LLM WebSocket:

```bash
cd backend
npm run configure:retell
```

Or manually via Retell dashboard:

1. Go to Retell Dashboard → Agents
2. Select your agent
3. Set "LLM Type" to "Custom LLM"
4. Set "Custom LLM WebSocket URL" to: `wss://your-domain.com/api/retell/llm`

## WebSocket Protocol

### Message Types

#### 1. Call Details (Initialization)

```json
{
  "interaction_type": "call_details",
  "call": {
    "call_id": "abc123",
    "agent_id": "agent_xyz"
  }
}
```

**Response:**

```json
{
  "response_type": "config",
  "config": {
    "auto_reconnect": true,
    "call_details": true
  }
}
```

#### 2. Ping Pong (Heartbeat)

```json
{
  "interaction_type": "ping_pong",
  "timestamp": 1234567890
}
```

**Response:**

```json
{
  "response_type": "ping_pong",
  "timestamp": 1234567890
}
```

#### 3. Update Only (Transcript Update)

```json
{
  "interaction_type": "update_only",
  "transcript": [
    { "role": "user", "content": "Hello" },
    { "role": "agent", "content": "Hi there!" }
  ]
}
```

**No response required**

#### 4. Response Required (User Input)

```json
{
  "interaction_type": "response_required",
  "response_id": 123,
  "transcript": [{ "role": "user", "content": "What services do you offer?" }]
}
```

**Response (Streaming):**

```json
// First chunk
{
  "response_type": "response",
  "response_id": 123,
  "content": "We offer ",
  "content_complete": false,
  "end_call": false
}

// Subsequent chunks
{
  "response_type": "response",
  "response_id": 123,
  "content": "AI-powered solutions",
  "content_complete": false,
  "end_call": false
}

// Final chunk
{
  "response_type": "response",
  "response_id": 123,
  "content": "",
  "content_complete": true,
  "end_call": false
}
```

#### 5. Reminder Required (Silence Detected)

```json
{
  "interaction_type": "reminder_required",
  "response_id": 124
}
```

**Response:**

```json
{
  "response_type": "response",
  "response_id": 124,
  "content": "I'm here to help. What would you like to know?",
  "content_complete": true,
  "end_call": false
}
```

## Features

### 1. Real-time Streaming

Responses are streamed in real-time for natural conversation flow:

```typescript
// Gemini generates response in chunks
for await (const chunk of stream) {
  // Immediately send to Retell
  ws.send(
    JSON.stringify({
      content: chunk,
      content_complete: false,
    })
  );
}
```

### 2. Context Continuity

Voice and text conversations share the same Gemini session:

```typescript
// Same session ID for both interfaces
const sessionId = callId; // or chatSessionId

// Both use the same Gemini service
await geminiService.sendMessage(sessionId, message);
```

### 3. Transcript Synchronization

Voice transcripts appear in the text chat interface:

```typescript
// VoiceButton emits transcript events
client.on("update", (update) => {
  const lastMessage = update.transcript[update.transcript.length - 1];
  onTranscript(lastMessage.content, lastMessage.role);
});

// Chatbot receives and displays them
const handleVoiceTranscript = (text, role) => {
  setMessages((prev) => [
    ...prev,
    {
      role: role === "user" ? Role.USER : Role.MODEL,
      text,
      source: "voice",
    },
  ]);
};
```

### 4. Error Handling

Graceful fallback on errors:

```typescript
try {
  const stream = await geminiService.sendMessageStream(sessionId, message);
  // Process stream...
} catch (error) {
  logger.error("Gemini error", { error });

  // Send fallback response
  ws.send(
    JSON.stringify({
      content:
        "I apologize, but I encountered an error. Could you please repeat that?",
      content_complete: true,
    })
  );
}
```

### 5. Session Management

Automatic cleanup on call end:

```typescript
ws.on("close", () => {
  // Clean up Gemini session
  geminiService.clearSession(sessionId);
});
```

## Testing

### 1. Test WebSocket Connection

```bash
# Install wscat for testing
npm install -g wscat

# Connect to WebSocket endpoint
wscat -c "ws://localhost:3000/api/retell/llm?call_id=test-123"

# Send test message
{"interaction_type":"response_required","response_id":1,"transcript":[{"role":"user","content":"Hello"}]}
```

### 2. Test Voice Integration

1. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Click the microphone button in the chat interface

4. Speak a question like "What services do you offer?"

5. Verify:
   - Voice is transcribed correctly
   - Gemini generates a response
   - Response is spoken back
   - Transcript appears in chat

### 3. Test Gemini Integration

```bash
cd backend
npm run test:gemini
```

### 4. Monitor Logs

```bash
# Watch backend logs
tail -f backend/logs/app.log

# Look for:
# - "Retell LLM WebSocket connected"
# - "Generating response for user message"
# - "Response generated successfully"
```

## Troubleshooting

### Issue: WebSocket Connection Fails

**Symptoms:**

- Voice button shows error
- No response from AI
- Console shows WebSocket error

**Solutions:**

1. Check backend is running: `curl http://localhost:3000/api/health`
2. Verify WebSocket URL in Retell agent configuration
3. Check firewall/proxy settings
4. Ensure ngrok tunnel is active (for development)

### Issue: No Gemini Response

**Symptoms:**

- Voice transcription works
- But no AI response generated

**Solutions:**

1. Check Gemini API key: `echo $GEMINI_API_KEY`
2. Test Gemini service: `npm run test:gemini`
3. Check logs for API errors
4. Verify API quota/rate limits

### Issue: Transcripts Not Syncing

**Symptoms:**

- Voice works but doesn't appear in chat
- Or vice versa

**Solutions:**

1. Check `onTranscript` callback in VoiceButton
2. Verify `handleVoiceTranscript` in Chatbot
3. Check console for transcript events
4. Ensure session IDs match

### Issue: Delayed Responses

**Symptoms:**

- Long pause before AI responds
- Choppy audio playback

**Solutions:**

1. Use streaming instead of full response
2. Reduce Gemini context size
3. Check network latency
4. Optimize WebSocket message size

### Issue: Session Not Persisting

**Symptoms:**

- AI forgets previous conversation
- Context lost between messages

**Solutions:**

1. Verify session ID is consistent
2. Check session cleanup logic
3. Ensure Gemini session is reused
4. Review conversation history management

## Performance Optimization

### 1. Streaming Responses

Always use streaming for better perceived performance:

```typescript
// Good: Streaming
const stream = await geminiService.sendMessageStream(sessionId, message);
for await (const chunk of stream) {
  ws.send(JSON.stringify({ content: chunk }));
}

// Bad: Waiting for full response
const response = await geminiService.sendMessage(sessionId, message);
ws.send(JSON.stringify({ content: response }));
```

### 2. Connection Pooling

Reuse WebSocket connections:

```typescript
// Keep connections alive
ws.on("ping", () => ws.pong());

// Implement reconnection logic
if (ws.readyState === WebSocket.CLOSED) {
  reconnect();
}
```

### 3. Message Batching

Batch small chunks for efficiency:

```typescript
let buffer = "";
const BATCH_SIZE = 50;

for await (const chunk of stream) {
  buffer += chunk;

  if (buffer.length >= BATCH_SIZE) {
    ws.send(JSON.stringify({ content: buffer }));
    buffer = "";
  }
}
```

### 4. Caching

Cache common responses:

```typescript
const responseCache = new Map<string, string>();

const getCachedResponse = (message: string) => {
  const normalized = message.toLowerCase().trim();
  return responseCache.get(normalized);
};
```

## Security Considerations

### 1. Authentication

Validate Retell requests:

```typescript
// Verify request origin
const origin = req.headers.origin;
if (!isAllowedOrigin(origin)) {
  ws.close(1008, "Unauthorized");
  return;
}
```

### 2. Rate Limiting

Prevent abuse:

```typescript
const rateLimiter = new Map<string, number>();

const checkRateLimit = (sessionId: string): boolean => {
  const count = rateLimiter.get(sessionId) || 0;
  if (count > MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  rateLimiter.set(sessionId, count + 1);
  return true;
};
```

### 3. Input Validation

Sanitize user input:

```typescript
const sanitizeMessage = (message: string): string => {
  return message.trim().slice(0, MAX_MESSAGE_LENGTH).replace(/[<>]/g, "");
};
```

### 4. Error Messages

Don't expose internal details:

```typescript
// Good
ws.send(
  JSON.stringify({
    content: "I encountered an error. Please try again.",
  })
);

// Bad
ws.send(
  JSON.stringify({
    content: `Database error: ${error.stack}`,
  })
);
```

## Best Practices

1. **Always use streaming** for real-time responses
2. **Keep sessions short** to manage memory
3. **Log all interactions** for debugging
4. **Implement heartbeat** to detect disconnections
5. **Handle errors gracefully** with user-friendly messages
6. **Monitor performance** with metrics and alerts
7. **Test thoroughly** with various scenarios
8. **Document changes** to the integration

## Future Enhancements

1. **Multi-language Support**: Detect and respond in user's language
2. **Emotion Detection**: Adjust tone based on user sentiment
3. **Voice Cloning**: Custom voice for brand consistency
4. **Advanced Analytics**: Track conversation quality metrics
5. **A/B Testing**: Test different prompts and configurations
6. **Fallback Strategies**: Multiple AI providers for redundancy

## Resources

- [Retell AI Documentation](https://docs.retellai.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Voice Integration Best Practices](./VOICE_TROUBLESHOOTING.md)
- [Gemini Integration Guide](./GEMINI_INTEGRATION.md)

## Support

For issues or questions:

1. Check this troubleshooting guide
2. Review backend logs in `backend/logs/`
3. Test individual components
4. Check Retell dashboard for call logs
5. Contact the development team
