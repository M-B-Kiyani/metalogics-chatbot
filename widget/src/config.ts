export interface WidgetConfig {
  apiKey: string;
  apiUrl?: string;
  brandColor?: string;
  position?: "bottom-right" | "bottom-left";
  greeting?: string;
  retellApiKey?: string;
  retellAgentId?: string;
}

export const defaultConfig: Partial<WidgetConfig> = {
  apiUrl: "http://localhost:3000",
  brandColor: "#3b82f6",
  position: "bottom-right",
  greeting:
    "Welcome to Metalogics.io. How may I help you today—learn about our services, book a consultation, or explore both options?",
};
