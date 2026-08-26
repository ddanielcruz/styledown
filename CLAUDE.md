# CLAUDE.md

Styledown turns Markdown into print-ready documents, entirely in the browser.

Read [`docs/DESIGN.md`](docs/DESIGN.md) first — it holds the decisions, the data model, and the build order. It is the only design doc. Keep it current rather than adding new ones.

## Must hold

- `src/lib/**` stays framework-free: no React, no imports from `src/components/**`. Lint enforces it.
- Document content never leaves the browser. No backend, no accounts, no telemetry — ever.
- The default document has to look good before any control is touched. A control that can't justify itself doesn't ship.

## How we work

- Before calling a milestone done, reread the batch and cut what turned out redundant.
- Pin exact dependency versions.

## Tests

Three Vitest projects. `lib` (node, no DOM) and `ui` (jsdom) are the fast pair and are what `pnpm test` runs; TDD in `src/lib/**`, which is where the logic lives and runs in milliseconds. `browser` is `pnpm test:browser` — the same Testing Library idiom against real Chromium, Firefox and WebKit through Playwright, in `*.browser.test.tsx`.

Reach for the `browser` project only for what jsdom structurally cannot answer: layout and overflow, hit-testing and focus, canvas and image encoding, and whether a key is delivered the same way by every engine. Anything that is a decision rather than a pixel belongs in `ui`, which is twenty times faster. WebKit there is Playwright's own build, not Safari — it catches what the engine does and says nothing about what Safari's menus do in front of it.

Test behaviour through what a user can see or do. A test that reaches into internal state is testing the wrong layer and will break on refactors that changed nothing real. Prefer fewer, sharper tests: a component test earns its place by covering a decision the component makes, not by proving it rendered.

Some things tests can't reach — whether the default document looks good, whether a PDF paginates cleanly. Verify those by rendering and looking, never by reasoning about the CSS. `scripts/print-to-pdf.mjs` drives a real Chrome through the real controls and `scripts/measure-pdf.mjs` reads the paper and margins back out of the file; anything that prints without `preferCSSPageSize` silently gives you US Letter and a measurement worth nothing.

## Commands

`pnpm dev` · `build` · `lint` · `check-types` · `test` · `test:browser` · `format` / `format:check`
