import React from "react";
import { Message, Role } from "../types";
import BotIcon from "./icons/BotIcon";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;
  const isVoice = message.source === "voice";

  return (
    <div
      className={`flex items-start gap-3 ${
        isModel ? "justify-start" : "justify-end"
      }`}
    >
      {isModel && (
        <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
          <BotIcon />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div
          className={`max-w-md md:max-w-lg p-3 rounded-xl whitespace-pre-wrap ${
            isModel
              ? "bg-slate-700 text-slate-200 rounded-tl-none"
              : "bg-blue-600 text-white rounded-br-none"
          }`}
        >
          {message.text}
        </div>
        {isVoice && (
          <div
            className={`flex items-center gap-1 text-xs text-slate-400 ${
              isModel ? "" : "justify-end"
            }`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
            <span>Voice</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
