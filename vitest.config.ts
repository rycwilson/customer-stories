import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['app/typescript/test/**/*.test.ts'],
    setupFiles: ['app/typescript/test/setup.ts'],
    environment: 'jsdom',
    // reporters: ['default'],
  },
});