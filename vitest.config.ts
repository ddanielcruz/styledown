import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // `src/lib` is pure TypeScript with no DOM, so `node` is the right default and the
    // fast one. Component tests opt in per file with `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
    },
  },
});
