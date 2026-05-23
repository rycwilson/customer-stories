---
applyTo: "app/typescript/**/*.ts"
---

## TypeScript configuration

- `../../tsconfig.json` — root config; compiles `app/typescript/src/**` to `app/typescript/emit/`, excludes `app/typescript/test/`
- `app/typescript/test/tsconfig.json` — one-line shim exists solely for tsserver directory traversal discovery
- `app/typescript/test/tsconfig.test.json` — actual test config; extends root config
- `vitest.config.ts` — points `typecheck.tsconfig` at `app/typescript/test/tsconfig.test.json`