import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5179,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor";
          }
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
            return "i18n";
          }
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }
          return null;
        },
      },
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
