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

  {
    files: ["app/typescript/**/*.ts"],
    rules: {
      // Allow unused variables (in some cases) when their names begin with an underscore.
      // This is a common convention for indicating that a variable is intentionally unused, 
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "varsIgnorePattern": "^_",
          "argsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
        }
      ]
    }
  }
]);