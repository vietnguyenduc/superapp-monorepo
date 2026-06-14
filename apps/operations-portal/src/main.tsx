﻿import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
import './index.css';

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
      <BrowserRouter future={routerFuture}>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
}
