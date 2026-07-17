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

// Prevent browser context menu (Copy, Paste, Translate, Share popup) on long press of non-input elements
document.addEventListener('contextmenu', (event) => {
  let target = event.target as HTMLElement | null;
  if (!target) return;

  // Move up to parent element if the target is a text node
  if (target.nodeType === 3 && target.parentElement) {
    target = target.parentElement as HTMLElement;
  }

  if (!target || typeof target.closest !== 'function') return;

  // Allow native context menus only on inputs, textareas, contenteditable elements, or elements explicitly marked selectable
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
  const isContentEditable = target.isContentEditable || target.closest('[contenteditable="true"]') !== null;
  const isSelectable = target.closest('.selectable-text') !== null;

  if (!isInput && !isContentEditable && !isSelectable) {
    event.preventDefault();
  }
}, { capture: true });

// Prevent text selection start from double-tapping or drag-selection on non-input elements
document.addEventListener('selectstart', (event) => {
  let target = event.target as HTMLElement | null;
  if (!target) return;

  // Move up to parent element if the target is a text node
  if (target.nodeType === 3 && target.parentElement) {
    target = target.parentElement as HTMLElement;
  }

  if (!target || typeof target.closest !== 'function') return;

  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
  const isContentEditable = target.isContentEditable || target.closest('[contenteditable="true"]') !== null;
  const isSelectable = target.closest('.selectable-text') !== null;

  if (!isInput && !isContentEditable && !isSelectable) {
    event.preventDefault();
  }
}, { capture: true });

// Register Service Worker for Progressive Web App (PWA) offline capabilities
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    let baseUrl = import.meta.env.BASE_URL || '/';
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    const swUrl = `${baseUrl}sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: baseUrl })
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

