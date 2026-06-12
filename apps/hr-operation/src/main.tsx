import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Add error handling for root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
  // Create a root element if it doesn't exist
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  console.log('Created new root element');
}

try {
  const root = ReactDOM.createRoot(rootElement || document.getElementById('root')!);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Failed to render React app:', error);
  
  // Fallback rendering
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; max-width: 500px; margin: 0 auto; font-family: sans-serif;">
        <h1 style="color: #e53e3e;">Error Rendering App</h1>
        <p>There was a problem rendering the application. Please check the console for details.</p>
        <pre style="background: #f7fafc; padding: 10px; border-radius: 4px; overflow: auto;">
          ${error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    `;
  }
}
