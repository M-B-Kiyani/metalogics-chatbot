import React, { useState, useEffect, useRef } from "react";
import { Message, Role } from "../types";
import { WidgetConfig } from "../config";
import { chatStorage } from "../storage";
import Loader from "./Loader";

interface UnifiedChatWidgetProps {
  config: WidgetConfig;
}

declare global {
  interface Window {
    RetellWebClient: any;
  }
}

const UnifiedChatWidget: React.FC<UnifiedChatWidgetProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const retellClientRef = useRef<any>(null);
  const retellLoadedRef = useRef(false);

  const brandColor = config.brandColor || "#3b82f6";
  const hasRetell = config.retellApiKey && config.retellAgentId;

  // Initialize chat history
  useEffect(() => {
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

  // Save messages to storage
  useEffect(() => {
    if (messages.length > 0 && !isInitializing) {
      chatStorage.saveMessages(messages);
    }
  }, [messages, isInitializing]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Retell
  useEffect(() => {
    if (!hasRetell || !isOpen || retellLoadedRef.current) return;

    const initRetell = async () => {
      try {
        // Wait for Retell SDK to load
        if (typeof window.RetellWebClient === "undefined") {
          console.warn("Retell SDK not loaded yet");
          return;
        }

        if (!retellClientRef.current) {
          retellClientRef.current = new window.RetellWebClient();
          retellLoadedRef.current = true;

          // Setup event listeners
          retellClientRef.current.on("call_started", () => {
            console.log("Voice call started");
            setIsVoiceActive(true);
            setVoiceStatus("Connected");
          });

          retellClientRef.current.on("call_ended", () => {
            console.log("Voice call ended");
            setIsVoiceActive(false);
            setVoiceStatus("");
          });

          retellClientRef.current.on("agent_start_talking", () => {
            console.log("Agent started talking");
            setVoiceStatus("Speaking...");
          });

          retellClientRef.current.on("agent_stop_talking", () => {
            console.log("Agent stopped talking");
            setVoiceStatus("Listening...");
          });

          retellClientRef.current.on("audio", (audio: any) => {
            console.log("Audio received:", audio);
          });

          retellClientRef.current.on("update", (update: any) => {
            console.log("Retell update:", update);

            // Handle transcript updates
            if (update.transcript) {
              update.transcript.forEach((entry: any) => {
                if (entry.role === "user" && entry.content) {
                  const userMessage: Message = {
                    role: Role.USER,
                    text: entry.content,
                    timestamp: Date.now(),
                  };
                  setMessages((prev) => {
                    // Avoid duplicates
                    const exists = prev.some(
                      (m) => m.text === entry.content && m.role === Role.USER
                    );
                    return exists ? prev : [...prev, userMessage];
                  });
                } else if (entry.role === "agent" && entry.content) {
                  const assistantMessage: Message = {
                    role: Role.MODEL,
                    text: entry.content,
                    timestamp: Date.now(),
                  };
                  setMessages((prev) => {
                    // Avoid duplicates
                    const exists = prev.some(
                      (m) => m.text === entry.content && m.role === Role.MODEL
                    );
                    return exists ? prev : [...prev, assistantMessage];
                  });
                }
              });
            }
          });

          retellClientRef.current.on("error", (error: any) => {
            console.error("Retell error:", error);
            setVoiceStatus("Error occurred");
            setIsVoiceActive(false);
          });

          console.log("✅ Retell initialized successfully");
        }
      } catch (error) {
        console.error("Failed to initialize Retell:", error);
      }
    };

    initRetell();

    return () => {
      if (retellClientRef.current && isVoiceActive) {
        retellClientRef.current.stopCall();
      }
    };
  }, [hasRetell, isOpen, config.retellApiKey, isVoiceActive]);

  // Handle text message send
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
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

  // Handle voice toggle
  const handleVoiceToggle = async () => {
    if (!hasRetell || !retellClientRef.current) {
      console.warn("Retell not available");
      return;
    }

    try {
      if (isVoiceActive) {
        // Stop voice call
        retellClientRef.current.stopCall();
        setIsVoiceActive(false);
        setVoiceStatus("");
      } else {
        // Start voice call - need to get access token from backend first
        setVoiceStatus("Connecting...");

        // Get access token from backend
        const response = await fetch(
          `${config.apiUrl}/api/retell/register-call`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              agentId: config.retellAgentId,
              sessionId: chatStorage.getSessionId(),
            }),
          }
        );

        const data = await response.json();

        if (data.accessToken) {
          // Start call with access token
          await retellClientRef.current.startCall({
            accessToken: data.accessToken,
            sampleRate: 24000,
            enableUpdate: true,
          });
          setIsVoiceActive(true);
          setVoiceStatus("Connected");
        } else {
          throw new Error("Failed to get access token");
        }
      }
    } catch (error) {
      console.error("Voice toggle error:", error);
      setVoiceStatus("Failed to start voice");
      setIsVoiceActive(false);
    }
  };

  // Handle clear chat
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
          type="button"
          onClick={() => setIsOpen(true)}
          className="metalogics-chat-button"
          style={{
            backgroundColor: brandColor,
            [config.position === "bottom-left" ? "left" : "right"]: "24px",
          }}
          aria-label="Open Metalogics Assistant"
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
          className="metalogics-chat-window"
          style={{
            [config.position === "bottom-left" ? "left" : "right"]: "24px",
          }}
        >
          {/* Header */}
          <div
            className="metalogics-chat-header"
            style={{ backgroundColor: brandColor }}
          >
            <div className="flex items-center space-x-3">
              <div className="metalogics-avatar">
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
                <h3 className="font-bold text-lg">Metalogics Assistant</h3>
                <p className="text-xs opacity-90">
                  {isVoiceActive ? voiceStatus : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClearChat}
                className="metalogics-icon-button"
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
                type="button"
                onClick={() => setIsOpen(false)}
                className="metalogics-icon-button"
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
          <div ref={chatContainerRef} className="metalogics-messages-container">
            {messages.map((msg, index) => (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`flex ${
                  msg.role === Role.USER ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`metalogics-message ${
                    msg.role === Role.USER
                      ? "metalogics-message-user"
                      : "metalogics-message-assistant"
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
                <div className="metalogics-message metalogics-message-assistant">
                  <Loader color={brandColor} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="metalogics-input-container">
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
                className="metalogics-text-input"
                disabled={isLoading || isVoiceActive}
              />

              {/* Voice Button */}
              {hasRetell && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  disabled={isLoading}
                  className={`metalogics-voice-button ${
                    isVoiceActive ? "metalogics-voice-active" : ""
                  }`}
                  style={
                    isVoiceActive
                      ? { backgroundColor: "#ef4444" }
                      : { backgroundColor: brandColor }
                  }
                  aria-label={isVoiceActive ? "Stop voice" : "Start voice"}
                  title={isVoiceActive ? "Stop voice" : "Start voice"}
                >
                  {isVoiceActive ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 6h12v12H6z" />
                    </svg>
                  ) : (
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </button>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !userInput.trim() || isVoiceActive}
                className="metalogics-send-button"
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
          <div className="metalogics-branding">
            Powered by <span className="font-semibold">Metalogics</span>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedChatWidget;
