// @ts-check

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Generated files: not lintable (dist output is not part of the TS project,
  // .astro types are machine-generated). Must be a lone object to act globally.
  { ignores: ["dist/", ".astro/"] },
  {
    files: ["**/*.{js,ts}"],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
]);
