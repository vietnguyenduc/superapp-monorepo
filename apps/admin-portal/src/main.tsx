import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './lib/supabase.ts'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initErrorTracking } from "@superapp/shared-utils";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
