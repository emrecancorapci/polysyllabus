// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import mdx from "@astrojs/mdx";

import tailwindcss from "@tailwindcss/vite";

import { unified } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";

import { rehypeContent } from "./src/plugins/rehype-content";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],

  markdown: {
    // Unified (not Sätteri): the lesson pipeline relies on remark/rehype
    // plugins for math (KaTeX) and Mermaid, which Sätteri cannot run.
    // rehypeContent must run before rehype-mermaid so <Mermaid> components
    // are rewritten to code blocks first; Shiki must skip mermaid blocks so
    // rehype-mermaid can claim them.
    syntaxHighlight: { type: "shiki", excludeLangs: ["math", "mermaid"] },
    processor: unified({
      // Smart punctuation mangles Mermaid syntax inside component children
      // (--> becomes —>, quotes become curly quotes); fenced code is exempt
      // but <Mermaid> children are prose to the parser.
      smartypants: false,
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        rehypeContent,
        [
          rehypeMermaid,
          {
            strategy: "inline-svg",
            // Theme matches the light design tokens from src/styles/global.css;
            // dark mode inverts the generated SVG via global.css.
            mermaidOptions: {
              theme: "base",
              themeVariables: {
                background: "transparent",
                primaryColor: "oklch(1 0 0)",
                primaryBorderColor: "oklch(0.922 0 0)",
                primaryTextColor: "oklch(0.145 0 0)",
                lineColor: "oklch(0.556 0 0)",
                textColor: "oklch(0.145 0 0)",
                mainBkg: "oklch(1 0 0)",
                nodeBorder: "oklch(0.922 0 0)",
                fontSize: "14px",
              },
            },
          },
        ],
      ],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
