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
    // NOTE: Vite 8 / Rolldown requires manualChunks to be a function, not an
    // object (the object form was supported by Rollup but throws
    // "manualChunks is not a function" under Rolldown).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("/react-router") || /[\\/]react[\\/]|[\\/]react-dom[\\/]/.test(id)) {
              return "vendor-react";
            }
            if (id.includes("/i18next") || id.includes("/react-i18next")) {
              return "vendor-i18n";
            }
            if (id.includes("/recharts")) {
              return "vendor-charts";
            }
            if (id.includes("/date-fns")) {
              return "vendor-date";
            }
            if (id.includes("/react-icons")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
    // xlsx (~400KB) is intentionally NOT listed here — it is dynamically
    // imported only when the user triggers export/import (see page changes).
    chunkSizeWarningLimit: 700,
  },
});
