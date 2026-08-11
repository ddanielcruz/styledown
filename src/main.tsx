import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// The default code theme is bundled for the same reason the default font is: the first
// paint must never be unstyled. M5 fetches the other five when they are chosen.
import 'highlight.js/styles/github.css';
import './index.css';
import './styles/print.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
