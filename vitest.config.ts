import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: { label: 'lib', color: 'green' },
          // No DOM, deliberately. `src/lib` is framework-free, so a test that reaches for
          // `document` should fail here rather than quietly pass — the same boundary the
          // lint rule enforces, enforced again by the runner.
          environment: 'node',
          include: ['src/lib/**/*.{test,spec}.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: { label: 'ui', color: 'magenta' },
          environment: 'jsdom',
          // Vitest stubs CSS imports to empty modules by default, which is right for a
          // stylesheet nobody asserts on and wrong for the code themes: those are imported
          // as text (`?inline`) and rendered as content, so stubbed out they leave an empty
          // `<style>` and a test that cannot see which theme is in the document. Costs
          // about half a second.
          css: true,
          setupFiles: ['./vitest.setup.ts'],
          include: [
            'src/{components,hooks,state}/**/*.{test,spec}.{ts,tsx}',
            // `App` is a component too, and the layout decisions it makes are its own.
            'src/*.{test,spec}.tsx',
          ],
          // The browser project's files sit in the same folders and would otherwise be
          // picked up here too, where every one of them would fail for the reason they
          // exist: jsdom cannot do the thing they are asking about.
          exclude: ['**/*.browser.{test,spec}.tsx'],
        },
      },
      {
        extends: true,
        // Tailwind is not in the root plugins because the other two projects do not need
        // it — `lib` renders nothing and `ui` asserts on roles rather than pixels. Here it
        // is the point: a layout test against unstyled HTML measures nothing.
        plugins: [tailwindcss()],
        test: {
          name: { label: 'browser', color: 'cyan' },
          include: ['src/**/*.browser.{test,spec}.tsx'],
          setupFiles: ['./vitest.browser.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // The three engines a reader might arrive in. WebKit is Playwright's own build
            // rather than Safari itself — same engine family, different build, and no
            // macOS menu layer — so it catches what the engine does and says nothing about
            // what Safari's menus do in front of it. `docs/DESIGN.md` records which
            // questions that leaves open.
            instances: [
              {
                browser: 'chromium',
                // The CI image runs as root, where Chromium refuses to start its sandbox.
                // Dropping it is safe for exactly this: the only page any of these open is
                // this app, built from this repository. Firefox and WebKit do not need it,
                // and an instance's provider options replace the parent's rather than
                // merging, so it is set here and nowhere else.
                provider: playwright({
                  launchOptions: { args: process.env.CI ? ['--no-sandbox'] : [] },
                }),
              },
              { browser: 'firefox' },
              { browser: 'webkit' },
            ],
          },
        },
      },
    ],
  },
});
