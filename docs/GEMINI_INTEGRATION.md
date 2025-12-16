# Gemini AI Integration Guide

This document explains how Gemini AI is integrated into the Metalogics AI Assistant for intelligent conversational responses.

## Overview

The chatbot uses Google's Gemini AI to provide intelligent, context-aware responses to user queries. The integration works on both frontend and backend:

- **Frontend**: Direct Gemini integration with RAG (Retrieval-Augmented Generation) using knowledge base
- **Backend**: Gemini-powered conversation service with fallback to rule-based responses

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chatbot Component                                    │  │
│  │  - User input handling                                │  │
│  │  - Message display                                    │  │
│  │  - Voice integration                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Gemini Service (Frontend)                           │  │
│  │  - Chat session management                           │  │
│  │  - RAG context injection                             │  │
│  │  - Streaming responses                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Knowledge Service                                    │  │
│  │  - Website content                                    │  │
│  │  - Curated knowledge base                            │  │
│  │  - Semantic search                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Conversation Controller                             │  │
│  │  - HTTP endpoints                                     │  │
│  │  - Request validation                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Conversation Service                                │  │
│  │  - Session management                                │  │
│  │  - Intent detection                                  │  │
│  │  - Booking flow handling                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Gemini Service (Backend)                            │  │
│  │  - Chat session management                           │  │
│  │  - Message processing                                │  │
│  │  - Streaming support                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

Add the following to your `.env` files:

**Frontend (`.env`):**

```env
VITE_GOOGLE_API_KEY=your-gemini-api-key-here
```

**Backend (`backend/.env`):**

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### Getting an API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your environment files

## Frontend Integration

### Gemini Service (`services/geminiService.ts`)

The frontend Gemini service provides:

- **Chat Session Management**: Creates and maintains conversation sessions
- **RAG Context Injection**: Enhances messages with relevant knowledge base content
- **Streaming Responses**: Real-time response streaming for better UX
- **Function Calling**: Triggers booking modal when appropriate

#### Key Features

```typescript
// Create a chat session
const chat = createChatSession();

// Send message with RAG context
const stream = await sendMessageWithContext(chat, userMessage);

// Process streaming response
for await (const chunk of stream) {
  // Update UI with chunk
}
```

### Knowledge Base Integration

The system uses a dual-source knowledge base:

1. **Website Content**: Scraped from metalogics.io
2. **Curated Knowledge**: Manually curated Q&A pairs

When a user asks a question:

1. Relevant context is retrieved from both sources
2. Context is injected into the Gemini prompt
3. Gemini generates a response based on the provided context

## Backend Integration

### Gemini Service (`backend/src/services/gemini.service.ts`)

The backend Gemini service provides:

- **Session Management**: Per-user chat sessions
- **Message Processing**: Send messages and get responses
- **Streaming Support**: Stream responses for real-time updates
- **Error Handling**: Graceful fallback on errors

#### Usage Example

```typescript
import { geminiService } from "./services/gemini.service";

// Check availability
if (geminiService.isAvailable()) {
  // Send a message
  const response = await geminiService.sendMessage(
    sessionId,
    "Tell me about your services"
  );

  // Or use streaming
  const stream = await geminiService.sendMessageStream(
    sessionId,
    "What are your business hours?"
  );

  for await (const chunk of stream) {
    console.log(chunk);
  }
}
```

### Conversation Service Integration

The conversation service automatically uses Gemini when available:

```typescript
// In conversation.service.ts
if (this.useGemini) {
  try {
    response = await geminiService.sendMessage(sessionId, message);
  } catch (error) {
    // Fallback to rule-based responses
    response = await this.generateResponse(context, message);
  }
} else {
  response = await this.generateResponse(context, message);
}
```

## System Prompt

The system prompt defines the AI assistant's behavior:

```
Metalogics AI Assistant

Role:
You are an intelligent, task-oriented virtual assistant for Metalogics.io.
Your purpose is to provide company information, capture qualified leads,
and manage appointment bookings through automated calendar integration.

Primary Objectives:
1. Information Guidance - Provide accurate company information
2. Lead Generation - Capture qualified leads
3. Appointment Booking - Guide users through booking process

Tone & Style:
- Professional, clear, and friendly
- Natural conversational English
- Concise sentences
- Avoid jargon unless asked
```

## Testing

### Frontend Testing

Test the frontend integration by:

1. Starting the development server:

   ```bash
   npm run dev
   ```

2. Open the chatbot and ask questions like:
   - "What services do you offer?"
   - "Tell me about Metalogics"
   - "I'd like to book a consultation"

### Backend Testing

Test the backend integration:

```bash
cd backend
npm run test:gemini
```

This will:

- Verify API key configuration
- Test message sending
- Test streaming responses
- Verify session management

### Manual API Testing

Test the conversation endpoint:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "message": "What services do you offer?"
  }'
```

## Features

### 1. Intelligent Responses

Gemini provides context-aware, natural language responses based on:

- User's question
- Conversation history
- Knowledge base content (frontend)
- System instructions

### 2. Intent Detection

The system automatically detects user intent:

- **Booking**: User wants to schedule an appointment
- **Inquiry**: User asking about services
- **Availability**: User checking available time slots
- **General**: General conversation

### 3. Booking Flow

When booking intent is detected:

1. Frontend: Opens booking modal via function calling
2. Backend: Guides user through information collection
3. Both: Validates and confirms booking details

### 4. Fallback Mechanism

If Gemini is unavailable:

- Backend falls back to rule-based responses
- Frontend shows error message
- System continues to function with reduced intelligence

## Best Practices

### 1. API Key Security

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for dev/staging/production

### 2. Rate Limiting

Gemini API has rate limits:

- Free tier: 60 requests per minute
- Consider implementing client-side rate limiting
- Cache common responses when appropriate

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
  const response = await geminiService.sendMessage(sessionId, message);
  return response;
} catch (error) {
  logger.error("Gemini error", { error });
  // Fallback to alternative response
  return fallbackResponse;
}
```

### 4. Session Management

- Clear sessions after inactivity
- Limit session history length
- Implement session cleanup on server restart

### 5. Context Management

- Keep context concise and relevant
- Prioritize recent messages
- Include only necessary knowledge base content

## Troubleshooting

### Issue: "API key not configured"

**Solution**: Ensure `GEMINI_API_KEY` or `VITE_GOOGLE_API_KEY` is set in your `.env` file.

### Issue: "Failed to get response from AI"

**Possible causes**:

1. Invalid API key
2. Rate limit exceeded
3. Network connectivity issues
4. API service outage

**Solution**: Check logs for specific error messages and verify API key validity.

### Issue: Slow responses

**Possible causes**:

1. Large context size
2. Network latency
3. API throttling

**Solution**:

- Use streaming for better perceived performance
- Reduce context size
- Implement response caching

### Issue: Inconsistent responses

**Solution**:

- Review and refine system prompt
- Adjust temperature parameter (lower = more consistent)
- Provide more specific instructions

## Performance Optimization

### 1. Streaming

Use streaming for better UX:

```typescript
const stream = await geminiService.sendMessageStream(sessionId, message);
for await (const chunk of stream) {
  // Update UI incrementally
}
```

### 2. Caching

Cache common responses:

```typescript
const cache = new Map<string, string>();
const cacheKey = `${sessionId}:${message}`;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const response = await geminiService.sendMessage(sessionId, message);
cache.set(cacheKey, response);
return response;
```

### 3. Context Optimization

Limit context size:

```typescript
// Keep only last N messages
const recentHistory = conversationHistory.slice(-10);
```

## Future Enhancements

1. **Multi-modal Support**: Add image and file upload support
2. **Voice Integration**: Direct Gemini voice input/output
3. **Advanced RAG**: Implement vector embeddings for better context retrieval
4. **Analytics**: Track conversation quality and user satisfaction
5. **A/B Testing**: Test different prompts and configurations
6. **Fine-tuning**: Custom model training for domain-specific responses

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Best Practices Guide](https://ai.google.dev/docs/best_practices)
- [Rate Limits](https://ai.google.dev/docs/rate_limits)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review logs in `backend/logs/`
3. Test with the provided test scripts
4. Contact the development team
