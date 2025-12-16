import React from "react";
import ReactDOM from "react-dom/client";
import UnifiedChatWidget from "./components/UnifiedChatWidget";
import { WidgetConfig, defaultConfig } from "./config";
import "./styles.css";

declare global {
  interface Window {
    MetalogicsChatbot: {
      init: (config: WidgetConfig) => void;
      destroy: () => void;
    };
  }
}

let root: ReactDOM.Root | null = null;
let container: HTMLDivElement | null = null;

const MetalogicsChatbot = {
  init: (userConfig: WidgetConfig) => {
    if (container) {
      console.warn("Metalogics Chatbot is already initialized");
      return;
    }

    const config = { ...defaultConfig, ...userConfig };

    // Create container
    container = document.createElement("div");
    container.id = "metalogics-chatbot-widget";
    document.body.appendChild(container);

    // Render widget
    root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <UnifiedChatWidget config={config as WidgetConfig} />
      </React.StrictMode>
    );

    console.log("✅ Metalogics Chatbot initialized");
  },

  destroy: () => {
    if (root) {
      root.unmount();
      root = null;
    }
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
    console.log("Metalogics Chatbot destroyed");
  },
};

// Expose to window
window.MetalogicsChatbot = MetalogicsChatbot;

// Auto-initialize if config is provided
if (typeof window !== "undefined") {
  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const apiKey = script.getAttribute("data-api-key");
    const apiUrl = script.getAttribute("data-api-url");
    const brandColor = script.getAttribute("data-brand-color");
    const position = script.getAttribute("data-position") as
      | "bottom-right"
      | "bottom-left";
    const retellApiKey = script.getAttribute("data-retell-api-key");
    const retellAgentId = script.getAttribute("data-retell-agent-id");

    if (apiKey) {
      MetalogicsChatbot.init({
        apiKey,
        apiUrl: apiUrl || defaultConfig.apiUrl,
        brandColor: brandColor || defaultConfig.brandColor,
        position: position || defaultConfig.position,
        retellApiKey: retellApiKey || undefined,
        retellAgentId: retellAgentId || undefined,
      });
    }
  }
}

export default MetalogicsChatbot;
