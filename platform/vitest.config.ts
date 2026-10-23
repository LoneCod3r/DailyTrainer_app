import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Compile component JSX the way Next does (tsconfig's `jsx: preserve`
  // leaves it to Next), so tests can server-render components.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
