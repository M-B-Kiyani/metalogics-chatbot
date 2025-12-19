export interface WidgetConfig {
  apiKey: string; // This should be the PUBLIC_WIDGET_KEY, not the main API key
  apiUrl?: string;
  brandColor?: string;
  position?: "bottom-right" | "bottom-left";
  greeting?: string;
  retellApiKey?: string;
  retellAgentId?: string;
}

export const defaultConfig: Partial<WidgetConfig> = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    "https://latest-chatbot-production.up.railway.app",
  brandColor: "#3b82f6",
  position: "bottom-right",
  greeting:
    "Welcome to Metalogics.io. How may I help you today—learn about our services, book a consultation, or explore both options?",
};
