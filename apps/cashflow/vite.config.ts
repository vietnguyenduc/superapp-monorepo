import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Split heavy vendor libs into shared chunks so navigating between lazy
    // pages doesn't re-download react/recharts/date-fns for every page chunk.
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — shared by every page
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // i18n — used app-wide
          "vendor-i18n": ["i18next", "react-i18next", "i18next-browser-languagedetector", "i18next-http-backend"],
          // Charts — only Dashboard needs them, but isolate so other pages
          // don't accidentally pull recharts in via a shared chunk
          "vendor-charts": ["recharts"],
          // Date utilities — used across many pages
          "vendor-date": ["date-fns"],
          // Icons — tree-shaken per icon but keep the runtime in one chunk
          "vendor-icons": ["react-icons"],
        },
      },
    },
    // xlsx (~400KB) is intentionally NOT listed here — it is dynamically
    // imported only when the user triggers export/import (see page changes).
    chunkSizeWarningLimit: 700,
  },
});
