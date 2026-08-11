import path from 'node:path';

import react from '@vitejs/plugin-react';
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
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/{components,hooks,state}/**/*.{test,spec}.{ts,tsx}'],
        },
      },
    ],
  },
});
