import React, { useState, useEffect, useRef } from "react";
import { Message, Role, BookingDetails } from "../types";
import { WidgetConfig } from "../config";
import { chatStorage } from "../storage";
import Loader from "./Loader";

interface ChatWidgetProps {
  config: WidgetConfig;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const brandColor = config.brandColor || "#3b82f6";

  useEffect(() => {
    // Load chat history
    const savedMessages = chatStorage.loadMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    } else {
      setMessages([
        {
          role: Role.MODEL,
          text: config.greeting || "Welcome! How can I help you today?",
          timestamp: Date.now(),
        },
      ]);
    }
    setIsInitializing(false);
  }, [config.greeting]);

  useEffect(() => {
    if (messages.length > 0 && !isInitializing) {
      chatStorage.saveMessages(messages);
    }
  }, [messages, isInitializing]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessage: Message = {
      role: Role.USER,
      text: userInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          sessionId: chatStorage.getSessionId(),
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: Role.MODEL,
          text: data.response || "Sorry, I encountered an error.",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: Role.MODEL,
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    chatStorage.clearMessages();
    setMessages([
      {
        role: Role.MODEL,
        text: config.greeting || "Welcome! How can I help you today?",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4"
          style={{
            backgroundColor: brandColor,
            [config.position === "bottom-left" ? "left" : "right"]: "24px",
            bottom: "24px",
            width: "60px",
            height: "60px",
            boxShadow: `0 4px 20px ${brandColor}40`,
          }}
          aria-label="Open chat"
        >
          <svg
            className="w-8 h-8 mx-auto text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{
            [config.position === "bottom-left" ? "left" : "right"]: "24px",
            bottom: "24px",
            width: "min(400px, calc(100vw - 48px))",
            height: "min(600px, calc(100vh - 100px))",
            maxHeight: "600px",
          }}
        >
          {/* Header */}
          <div
            className="rounded-t-2xl p-4 text-white flex justify-between items-center"
            style={{ backgroundColor: brandColor }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  style={{ color: brandColor }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Metalogics AI</h3>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Clear chat"
                title="Clear chat history"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map((msg, index) => (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`flex ${
                  msg.role === Role.USER ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === Role.USER
                      ? "text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                  style={
                    msg.role === Role.USER
                      ? { backgroundColor: brandColor }
                      : {}
                  }
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                  <Loader color={brandColor} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ focusRing: `${brandColor}40` }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="rounded-full p-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                style={{ backgroundColor: brandColor }}
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Branding */}
          <div className="px-4 py-2 text-center text-xs text-gray-500 bg-white rounded-b-2xl">
            Powered by <span className="font-semibold">Metalogics</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
