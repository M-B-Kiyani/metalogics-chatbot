import { Message } from "./types";

const STORAGE_KEY = "metalogics_chat_history";
const SESSION_KEY = "metalogics_session_id";

export const chatStorage = {
  saveMessages: (messages: Message[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  },

  loadMessages: (): Message[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return [];
    }
  },

  clearMessages: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }
  },

  getSessionId: (): string => {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  },
};
