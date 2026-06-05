import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["app/typescript/emit/**"] },

  // Source files
  {
    files: ["app/typescript/**/*.ts"],
    ignores: ["app/typescript/test/**"],
    plugins: { js },
    extends: ["js/recommended", ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
  },

  // Test files
  // We may want to provide a separate config for vitest in the future.
  // For example, eslint-plugin-vitest provides a vitest.configs.recommended that adds test-aware rules 
  // and relaxes things like no-unused-expressions (needed for expect chains).
  {
    files: ["app/typescript/test/**/*.ts"],
    plugins: { js },
    extends: ["js/recommended", ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
]);