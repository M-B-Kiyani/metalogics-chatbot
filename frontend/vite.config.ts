import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: Number(env.PORT) || 5173,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    plugins: [react()],
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            gemini: ["@google/genai"],
            retell: ["retell-client-js-sdk", "retell-sdk"],
          },
        },
      },
    },
    define: {
      "process.env.API_KEY": JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ""
      ),
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ""
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
