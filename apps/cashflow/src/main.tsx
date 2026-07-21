import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/components.css";
import "./styles/apple-theme.css";
import "./i18n";
import { AuthProvider } from "@superapp/iam";
import { initErrorTracking } from "@superapp/shared-utils";

initErrorTracking({ appName: "cashflow" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
