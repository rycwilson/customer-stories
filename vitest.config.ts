import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['app/typescript/test/**/*.test.ts'],
    setupFiles: ['app/typescript/test/setup.ts'],
    environment: 'jsdom',
    // reporters: ['default'],
    coverage: {
      provider: 'v8' // or 'istanbul'
    },

    // When type-checking is run explicitly via `vitest typecheck` use the path to config 
    // defined here. Editor type-checking will find tsconfig.test.json via tsserver traversal to 
    // app/typescript/test/tsconfig.json which is a shim for tsconfig.test.json.
    typecheck: {
      tsconfig: 'app/typescript/test/tsconfig.test.json',
    },
  },
});