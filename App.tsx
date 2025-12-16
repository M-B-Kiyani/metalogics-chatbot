import React from "react";
import Chatbot from "./components/Chatbot";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col">
        <header className="text-center mb-4">
          <h1 className="text-3xl font-bold text-slate-100">
            Metalogics AI Assistant
          </h1>
          <p className="text-slate-400">
            Your intelligent guide for information and appointments
          </p>
        </header>
        <main className="flex-grow flex flex-col bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <Chatbot />
        </main>
        <footer className="text-center mt-4 text-xs text-slate-500">
          <p>
            <strong>Powered by Metalogics</strong> | &copy; 2025-26{" "}
            <a href="https://metalogics.io/">Metalogics.io</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
