import React, { useState, useEffect, useRef } from "react";
import { RetellWebClient } from "retell-client-js-sdk";

interface VoiceButtonProps {
  onTranscript?: (text: string, role: "user" | "agent") => void;
  agentId?: string;
  disabled?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  onTranscript,
  agentId = import.meta.env.VITE_RETELL_AGENT_ID ||
    "your_retell_agent_id_heredb",
  disabled = false,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retellClientRef = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    // Initialize Retell client
    retellClientRef.current = new RetellWebClient();

    // Set up event listeners
    const client = retellClientRef.current;

    client.on("call_started", () => {
      console.log("Call started");
      setIsCallActive(true);
      setIsConnecting(false);
      setError(null);
    });

    client.on("call_ended", () => {
      console.log("Call ended");
      setIsCallActive(false);
      setIsConnecting(false);
    });

    client.on("agent_start_talking", () => {
      console.log("Agent started talking");
    });

    client.on("agent_stop_talking", () => {
      console.log("Agent stopped talking");
    });

    client.on("audio", (audio: Uint8Array) => {
      // Audio data received
      console.log("Audio data received:", audio.length);
    });

    client.on("update", (update: any) => {
      // Transcript updates - log full structure for debugging
      console.log(
        "Retell update event received:",
        JSON.stringify(update, null, 2)
      );

      if (
        update.transcript &&
        Array.isArray(update.transcript) &&
        onTranscript
      ) {
        // Process each transcript entry
        update.transcript.forEach((entry: any, index: number) => {
          console.log(`Transcript entry ${index}:`, {
            role: entry.role,
            content: entry.content,
          });
        });

        // Get the last message
        const lastMessage = update.transcript[update.transcript.length - 1];
        if (lastMessage && lastMessage.content) {
          const role = lastMessage.role === "user" ? "user" : "agent";
          console.log(
            `Sending transcript to chat: [${role}] ${lastMessage.content}`
          );
          onTranscript(lastMessage.content, role);
        }
      }
    });

    client.on("error", (error: any) => {
      console.error("Retell error:", error);
      setError(error.message || "An error occurred");
      setIsCallActive(false);
      setIsConnecting(false);
    });

    return () => {
      // Cleanup
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
    };
  }, [onTranscript]);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Request microphone permission first
      console.log("Requesting microphone permission...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
        console.log("Microphone permission granted");
      } catch (permErr) {
        throw new Error(
          "Microphone permission denied. Please allow microphone access."
        );
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

      console.log("Registering call with backend...", { apiBaseUrl, agentId });

      // Register call with backend
      const response = await fetch(`${apiBaseUrl}/api/retell/register-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          sessionId: `web-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to register call: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("Backend registration failed:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          console.error("Backend registration failed:", errorText);
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Call registered successfully:", { callId: data.callId });

      if (!data.success || !data.accessToken) {
        throw new Error("Invalid response from server");
      }

      // Start the call with Retell
      console.log("Starting Retell call with access token...");
      await retellClientRef.current?.startCall({
        accessToken: data.accessToken,
        sampleRate: 24000, // Explicitly set sample rate
      });

      console.log("Retell call started successfully");
    } catch (err) {
      console.error("Error starting call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setIsConnecting(false);
    }
  };

  const stopCall = () => {
    retellClientRef.current?.stopCall();
    setIsCallActive(false);
    setIsConnecting(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={isCallActive ? stopCall : startCall}
        disabled={isConnecting || disabled}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
          isCallActive
            ? "bg-red-600 hover:bg-red-700 animate-pulse"
            : isConnecting
            ? "bg-yellow-600 cursor-wait"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          isCallActive
            ? "End voice call"
            : isConnecting
            ? "Connecting..."
            : "Start voice call"
        }
        aria-label={
          isCallActive
            ? "End voice call"
            : isConnecting
            ? "Connecting to voice"
            : "Start voice call"
        }
      >
        {isConnecting ? (
          <>
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Connecting...</span>
          </>
        ) : isCallActive ? (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            <span>End Call</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            <span>Call AI</span>
          </>
        )}
      </button>
      {error && (
        <div className="text-xs text-red-400 max-w-xs text-center">{error}</div>
      )}
      {isCallActive && (
        <div className="text-xs text-green-400 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Call in progress
        </div>
      )}
    </div>
  );
};

export default VoiceButton;
