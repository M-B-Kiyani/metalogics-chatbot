import React from "react";

interface LoaderProps {
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({ color = "#3b82f6" }) => {
  return (
    <div className="flex justify-center items-center space-x-2 py-4">
      <div
        className="w-3 h-3 rounded-full animate-bounce"
        style={{
          backgroundColor: color,
          animationDelay: "0ms",
          animationDuration: "600ms",
        }}
      />
      <div
        className="w-3 h-3 rounded-full animate-bounce"
        style={{
          backgroundColor: color,
          animationDelay: "150ms",
          animationDuration: "600ms",
        }}
      />
      <div
        className="w-3 h-3 rounded-full animate-bounce"
        style={{
          backgroundColor: color,
          animationDelay: "300ms",
          animationDuration: "600ms",
        }}
      />
    </div>
  );
};

export default Loader;
