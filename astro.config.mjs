// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import mdx from "@astrojs/mdx";

import tailwindcss from "@tailwindcss/vite";

import { unified } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],

  markdown: {
    // Unified (not Sätteri): the lesson pipeline relies on remark/rehype
    // plugins for math (KaTeX) and Mermaid, which Sätteri cannot run.
    // Shiki must skip mermaid blocks so rehype-mermaid can claim them.
    syntaxHighlight: { type: "shiki", excludeLangs: ["math", "mermaid"] },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, [rehypeMermaid, { strategy: "inline-svg" }]],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
