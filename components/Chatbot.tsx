import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message, Role, BookingDetails } from "../types";
import {
  createChatSession,
  sendMessageWithContext,
} from "../services/geminiService";
import { knowledgeService } from "../services/knowledgeService";
import { Chat } from "@google/genai";
import ChatMessage from "./ChatMessage";
import BookingModal from "./BookingModal";
import SendIcon from "./icons/SendIcon";
import VoiceButton from "./VoiceButton";
import { GenerateContentResponse } from "@google/genai";

const Chatbot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      text: "Welcome to Metalogics.io. How may I help you today—learn about our services, book a consultation, or explore both options?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = createChatSession();
    if (session) {
      setChat(session);

      // Check knowledge base status
      const stats = knowledgeService.getStats();
      if (!stats.loaded || stats.chunks === 0) {
        console.warn(
          "⚠️ Knowledge base not loaded. Run: npm run build:knowledge:all"
        );
      } else {
        console.log(
          `✅ Knowledge base loaded: ${stats.chunks} chunks from multiple sources`
        );
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: Role.MODEL,
          text: "Error: Gemini API key is not configured. Please set the API_KEY environment variable.",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const streamToMessageHandler = useCallback(
    async (stream: AsyncGenerator<GenerateContentResponse>) => {
      let fullResponseText = "";
      let modelMessageIndex = -1;

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullResponseText += chunkText;

        if (modelMessageIndex === -1) {
          // Create new message on first chunk
          setMessages((prev) => {
            modelMessageIndex = prev.length;
            return [...prev, { role: Role.MODEL, text: fullResponseText }];
          });
        } else {
          // Update existing message
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages[modelMessageIndex]) {
              newMessages[modelMessageIndex] = {
                role: Role.MODEL,
                text: fullResponseText,
              };
            }
            return newMessages;
          });
        }

        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          if (chunk.functionCalls[0].name === "request_booking_info") {
            setIsBookingModalOpen(true);
          }
        }
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading || !chat) return;

      setIsLoading(true);
      const newUserMessage: Message = { role: Role.USER, text: messageText };
      setMessages((prev) => [...prev, newUserMessage]);
      setUserInput("");

      try {
        // Use enhanced message sending with RAG context
        const stream = await sendMessageWithContext(chat, messageText);
        await streamToMessageHandler(stream);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: Role.MODEL,
            text: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, chat, streamToMessageHandler]
  );

  const handleBookingSubmit = async (details: BookingDetails) => {
    setIsBookingModalOpen(false);
    const bookingConfirmation = `Great, the form is submitted with the following details:
        - Name: ${details.name}
        - Company: ${details.company}
        - Email: ${details.email}
        - Phone: ${details.phone}
        - Time: ${details.timeSlot?.startTime.toLocaleString()} for ${
      details.timeSlot?.duration
    } minutes.
        - Inquiry: ${details.inquiry}
        
        I will now confirm the booking.`;

    await handleSendMessage(bookingConfirmation);
  };

  const handleVoiceTranscript = useCallback(
    async (transcript: string, role: "user" | "agent") => {
      // When voice transcript is received, add it to the chat
      console.log(
        `Voice transcript received - Role: ${role}, Text: "${transcript}"`
      );

      if (!transcript || transcript.trim().length === 0) {
        console.log("Skipping empty transcript");
        return;
      }

      setMessages((prev) => {
        const messageRole = role === "user" ? Role.USER : Role.MODEL;
        const lastMsg = prev[prev.length - 1];

        // Check if we should update the last message or create a new one
        if (
          lastMsg &&
          lastMsg.role === messageRole &&
          lastMsg.source === "voice"
        ) {
          // If the transcript is different, update it (handles streaming updates)
          if (lastMsg.text !== transcript) {
            console.log(
              `Updating last ${role} message from "${lastMsg.text}" to "${transcript}"`
            );
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: messageRole,
              text: transcript,
              source: "voice",
            };
            return updated;
          }
          // Same content, no update needed
          console.log(`Skipping duplicate transcript for ${role}`);
          return prev;
        }

        // Add new message
        console.log(`Adding new ${role} message: "${transcript}"`);
        return [
          ...prev,
          {
            role: messageRole,
            text: transcript,
            source: "voice",
          },
        ];
      });

      // If this is a user message and we have a chat session,
      // also send it through Gemini for context continuity
      // (The voice AI will handle the actual response, but this keeps the chat in sync)
      if (role === "user" && chat) {
        console.log("Syncing voice message with Gemini chat context");
        try {
          // Send to Gemini but don't display the response (voice AI handles that)
          await chat.sendMessage({ message: transcript });
        } catch (error) {
          console.error("Error syncing voice message with Gemini:", error);
        }
      }
    },
    [chat]
  );

  return (
    <>
      <div
        ref={chatContainerRef}
        className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4"
      >
        {messages.map((msg, index) => (
          <ChatMessage
            key={`msg-${index}-${msg.text.substring(0, 20)}`}
            message={msg}
          />
        ))}
        {isLoading && messages[messages.length - 1].role === Role.USER && (
          <div className="flex justify-start items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        )}
      </div>
      <div className="p-4 bg-slate-700/50 border-t border-slate-600">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(userInput);
          }}
          className="flex items-center space-x-2"
        >
          <VoiceButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading || !chat}
          />
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message or use voice..."
            className="flex-grow bg-slate-800 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading || !chat}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim() || !chat}
            className="bg-blue-600 text-white rounded-lg p-3 disabled:bg-slate-500 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            aria-label="Send message"
            title="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
      />
    </>
  );
};

export default Chatbot;
