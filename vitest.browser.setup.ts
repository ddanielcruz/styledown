/*
 * The browser project's setup, which is mostly the absence of the other one's.
 *
 * `vitest.setup.ts` is a list of things jsdom does not have — `ResizeObserver`, layout on a
 * `Range`, `matchMedia`. A real browser has all of them, and stubbing any of it here would
 * throw away the only reason these tests exist. What is left is the stylesheets, because a
 * test that measures an element has to be measuring a styled one.
 */
import '@/index.css';
import '@/styles/document.css';
import '@/styles/print.css';
import { afterEach } from 'vitest';
import { cleanup } from 'vitest-browser-react';

// Same reason as the jsdom project's: this repo does not set `globals: true`, so nothing
// auto-registers and a second render would mount on top of the first.
afterEach(() => {
  cleanup();
});
