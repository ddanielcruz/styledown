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

Two Vitest projects: `lib` (node, no DOM) and `ui` (jsdom). TDD in `src/lib/**` — that is where the logic lives and it runs in milliseconds.

Test behaviour through what a user can see or do. A test that reaches into internal state is testing the wrong layer and will break on refactors that changed nothing real. Prefer fewer, sharper tests: a component test earns its place by covering a decision the component makes, not by proving it rendered.

Some things tests can't reach — whether the default document looks good, whether a PDF paginates cleanly. Verify those by rendering and looking, never by reasoning about the CSS.

## Commands

`pnpm dev` · `build` · `lint` · `check-types` · `test` · `format` / `format:check`
