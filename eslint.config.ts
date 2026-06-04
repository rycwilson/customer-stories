import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["app/typescript/emit/**"] },
  { 
    files: ["app/typescript/**/*.ts"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser } 
  },
  tseslint.configs.recommended,
]);
4