import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-registers its cleanup when it finds a global `afterEach`
// (i.e. `test.globals: true`), which this project doesn't set. Without this, a second
// `render()` in the same file leaves the previous DOM mounted and same-text queries collide.
afterEach(() => {
  cleanup();
});

// jsdom does no layout, so it has no `ResizeObserver` — and the panel library constructs
// one the moment a `Group` mounts, which takes the whole app down with it. The stub never
// reports a resize: anything that depends on a real measurement has to be checked in a
// browser, which is where the sheet's own sizing is checked anyway.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom ships no `matchMedia`. This app is media-query-shaped by nature — print styles are
// a core mechanism — so anything that asks about `print` or a colour scheme needs a stub.
// It always reports no match: components must not depend on a query being true in tests.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
