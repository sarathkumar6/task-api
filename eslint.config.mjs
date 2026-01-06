import js from "@eslint/js";
import jestPlugin from "eslint-plugin-jest";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // 1. GLOBAL IGNORES (Replaces .eslintignore)
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "prisma/generated/**",
      "prisma/migrations/**",
      "scripts/snippets/**",
    ],
  },

  // 2. BASE CONFIG
  js.configs.recommended,

  // 3. PROJECT CUSTOMIZATIONS
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
        console: "readonly",
      },
    },
    plugins: {
      jest: jestPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      "prettier/prettier": "error",
      "no-unused-vars": "warn",
      "prefer-const": "error",
      "no-console": "off",
    },
  },

  // 4. JEST SPECIFIC RULES
  {
    files: ["**/*.test.js", "**/__tests__/**"],
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },
];
