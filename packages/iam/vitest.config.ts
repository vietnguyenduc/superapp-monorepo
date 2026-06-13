import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@repo/types': path.resolve(__dirname, '../types/src'),
      '@superapp/shared-utils': path.resolve(__dirname, '../shared-utils/src'),
    },
  },
});
