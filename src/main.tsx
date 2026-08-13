import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// The document's faces, all of them, plus JetBrains Mono for code. A system mono stack
// costs nothing to ship but sets code differently on every machine, and a PDF that
// changes depending on who exported it is not a document.
//
// Bundling every family sounds like shipping megabytes and is not: Fontsource splits each
// face by `unicode-range`, so a family nobody picks costs its `@font-face` text and
// downloads no font at all — the browser fetches a woff2 only once a rule matches text
// with it. In exchange there is no CDN in the render path and no face that might still be
// arriving when the reader hits print.
//
// Each family is imported twice. The package root is the upright weight axis alone, so
// without the italic entry every `<em>` in the document is a slant the browser drew
// itself, which is not the same shape as the italic the designer drew.
import '@fontsource-variable/inter';

import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/lora';

import '@fontsource-variable/lora/wght-italic.css';
import '@fontsource-variable/merriweather';

import '@fontsource-variable/merriweather/wght-italic.css';
import '@fontsource-variable/source-sans-3';

import '@fontsource-variable/source-sans-3/wght-italic.css';
import '@fontsource-variable/source-serif-4';

import '@fontsource-variable/source-serif-4/wght-italic.css';
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
