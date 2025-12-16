import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/widget.tsx"),
      name: "MetalogicsChatbot",
      fileName: "metalogics-chatbot",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        assetFileNames: "metalogics-chatbot.[ext]",
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
