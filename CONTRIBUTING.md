# Contributing

Thanks for looking. Bug reports and fixes are welcome without ceremony. Features are a
different conversation, and the short version is below.

## Before you build a feature, open an issue

Styledown ships **five controls** on purpose. [`docs/DESIGN.md`](docs/DESIGN.md) lists them,
and lists what is deliberately not being built. The rule the project is held to is that a
control must earn its place by improving a document that already looks good — "it was easy to
add" is not a reason.

That makes a feature PR a risky thing to write on spec: the honest answer to a good idea is
often "yes, and not in v1". An issue first costs you nothing and may save you an evening.

Fixes, correctness, accessibility, print quality and performance need no such warning.

## Two rules that are not negotiable

1. **Nothing the reader writes leaves the browser.** No backend, no accounts, no telemetry, no
   third-party request in the render path. A dependency that phones home cannot be added.
2. **`src/lib/**` stays framework-free.** No React, no imports from `src/components/**`. The
   core is testable without rendering anything, and lint enforces the boundary.

## Getting set up

Node (see [`.nvmrc`](.nvmrc)) and pnpm.

```bash
pnpm install
pnpm dev
```

Before pushing: `pnpm format` · `lint` · `check-types` · `test` · `build`. CI runs all five on
every pull request, cheapest first.

Dependencies are pinned to exact versions, and the lockfile is committed.

## Tests

Two Vitest projects. `lib` runs in Node with no DOM, which is where the logic lives and where
tests are written first; `ui` runs in jsdom.

Test what a user can see or do. A test that reaches into internal state is testing the wrong
layer and will break on a refactor that changed nothing real — and a component test earns its
place by covering a decision the component makes, not by proving that it rendered.

**Some things tests cannot reach.** Whether a PDF paginates cleanly, whether the default
document looks good, whether a layout survives a phone. Those are checked by rendering and
looking, never by reasoning about the CSS:

```bash
node scripts/print-to-pdf.mjs http://localhost:5173/styledown/ docs/sample-document.md /tmp/out.pdf
node scripts/measure-pdf.mjs /tmp/out.pdf
node scripts/screenshot.mjs http://localhost:5173/styledown/
```

Anything that prints without `preferCSSPageSize` silently gives you US Letter and a
measurement worth nothing, which is why these exist rather than a generic screenshot tool.

If you change how a document looks or paginates, say in the pull request what you printed and
what came back.

## Documentation

`docs/DESIGN.md` is the only design doc, and it is kept current rather than supplemented — if
a change makes something in it untrue, the same PR fixes it. New documents are usually the
wrong answer.

Commit messages are lowercase `type: subject`, and the body is for **why**, especially when
the reason is not visible in the diff.
