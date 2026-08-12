import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, CompanyProvider } from '@superapp/iam';
import App from './App';
import './index.css';
import { initErrorTracking } from "@superapp/shared-utils";

initErrorTracking({ appName: 'operations-portal' });

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
}

try {
  const root = createRoot(rootElement || document.getElementById('root')!);
  
  root.render(
    <StrictMode>
      <AuthProvider>
        <CompanyProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CompanyProvider>
      </AuthProvider>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
}
