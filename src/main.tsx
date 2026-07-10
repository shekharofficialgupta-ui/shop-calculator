import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CurrencyProvider } from './CurrencyContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </StrictMode>,
);

// Register Service Worker for Progressive Web App (PWA) offline capabilities
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`;
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('PWA Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('PWA Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

