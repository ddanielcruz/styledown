# CLAUDE.md

Styledown turns Markdown into print-ready documents, entirely in the browser.

Read [`docs/DESIGN.md`](docs/DESIGN.md) first — it holds the decisions, the data model, and the build order. It is the only design doc. Keep it current rather than adding new ones.

## Must hold

- `src/lib/**` stays framework-free: no React, no imports from `src/components/**`. Lint enforces it.
- Document content never leaves the browser. No backend, no accounts, no telemetry — ever.
- The default document has to look good before any control is touched. A control that can't justify itself doesn't ship.

## How we work

- TDD in `src/lib/**`. Pure functions, fast tests, nothing rendered.
- Verify print and PDF output by actually printing it, not by reasoning about the CSS.
- Before calling a milestone done, reread the batch and cut what turned out redundant.
- Pin exact dependency versions.

## Commands

`pnpm dev` · `build` · `lint` · `check-types` · `test` · `format` / `format:check`
