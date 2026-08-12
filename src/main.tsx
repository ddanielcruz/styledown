import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// The document's own faces, bundled: Inter for prose, JetBrains Mono for code. A system
// mono stack costs nothing to ship but sets code differently on every machine, and a PDF
// that changes depending on who exported it is not a document. M5 fetches the other
// families on demand — these two are the default, and the default must never flash.
// Fontsource splits its subsets by `unicode-range`, so only latin is actually fetched.
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

// The default code theme is bundled for the same reason: the first paint must never be
// unstyled. M5 fetches the other five when they are chosen.
import 'highlight.js/styles/github.css';
import './index.css';
// Last of the three, deliberately. All of these are unlayered, so they settle against
// each other on order rather than losing to Tailwind's layers — and the document's own
// stylesheet is the one that must win.
import './styles/document.css';
import './styles/print.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
