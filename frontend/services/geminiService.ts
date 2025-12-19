import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { knowledgeService } from "./knowledgeService";

const SYSTEM_PROMPT = `Metalogics AI Assistant

Role:
You are an intelligent, task-oriented virtual assistant for Metalogics.io.
Your purpose is to provide company information, capture qualified leads, and manage appointment bookings through automated calendar integration.

🎯 Primary Objectives

Information Guidance
Accurately provide information about Metalogics’ services, solutions, and company details using content from https://metalogics.io.
Maintain a professional, helpful, and conversational tone aligned with Metalogics branding.

Lead Generation
When a user shows interest or requests a meeting, prompt them to fill out a short lead capture form (name, company, email, phone number, inquiry details).

Appointment Booking
When a user wants to book a meeting, you must call the 'request_booking_info' function. Do not ask for their details in the chat. The function call will open a form for them.

⏱ Scheduling Rules
Meeting Type	Duration	Frequency Limit
Consultation	15 minutes	Maximum 2 per 90 minutes
Meeting / Consultation	30 minutes	Maximum 2 per 3 hours
Meeting	45 minutes	Maximum 2 per 5 hours
Consultation / Meeting	60 minutes	Maximum 2 per 12 hours

Behavior:
Only show available, valid options.
Verify booking confirmation with the user before finalizing.

🧩 Conversation Flow

Greeting:
Welcome the user and ask whether they’d like information, a consultation, or both.

Information Handling:
Respond accurately to user queries about Metalogics.
Encourage booking a consultation when appropriate.

Booking Process:
When ready to book, call 'request_booking_info' to let the user select a time and provide their details.
After the user submits the form, you will receive their details. Confirm that you have received them and that the meeting is booked.

Error Handling: Politely inform the user if no slots are available and suggest alternative times.

Security: Handle personal data according to Metalogics’ privacy and data-protection policies.

🗣 Tone & Style
Professional, clear, and friendly.
Speak in natural conversational English.
Use concise sentences and avoid jargon unless asked for technical details.`;

const requestBookingInfo: FunctionDeclaration = {
  name: "request_booking_info",
  description:
    "Opens a form for the user to select an appointment time and provide their contact details for booking.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.error("API_KEY environment variable not set.");
}

export const createChatSession = (): Chat | null => {
  if (!ai) return null;
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: [requestBookingInfo] }],
    },
  });
};

/**
 * Enhanced message sending with dual-source RAG context injection
 */
export const sendMessageWithContext = async (
  chat: Chat,
  userMessage: string
): Promise<AsyncGenerator<any>> => {
  // Retrieve relevant context from both knowledge sources
  const context = await knowledgeService.retrieveRelevantContext(
    userMessage,
    5
  );

  // Inject context into the message if available
  let enhancedMessage = userMessage;
  if (context) {
    enhancedMessage = `[KNOWLEDGE BASE CONTEXT]
The following information is from Metalogics' official knowledge base and website. Use this as your PRIMARY source of truth when answering the user's question.

${context}

[USER QUESTION]
${userMessage}

[INSTRUCTIONS]
- Answer the user's question using ONLY the provided context above
- Prioritize information marked as "📌 Official" over "🌐 Website" sources
- If the context contains the answer, provide it confidently and naturally
- If the context doesn't fully answer the question, acknowledge what you know from the context and what you don't
- Be conversational, helpful, and professional
- Do NOT make up information not present in the context
- If appropriate, suggest booking a consultation for detailed discussions`;
  }

  return chat.sendMessageStream({ message: enhancedMessage });
};
