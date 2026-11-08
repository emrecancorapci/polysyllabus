// @ts-check

import js from "@eslint/js";
import * as astroParser from "astro-eslint-parser";
import astro from "eslint-plugin-astro";
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
  {
    files: ["**/*.astro"],
    extends: [
      astro.configs["flat/recommended"],
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      // Re-state the parser explicitly: merging this block's languageOptions
      // with the plugin's base config drops it otherwise.
      parser: astroParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        projectService: true,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      // Biome is the only formatter (AGENTS.md); the plugin turns on
      // prettier/prettier for Astro virtual JS/TS files.
      "prettier/prettier": "off",
    },
  },
]);
