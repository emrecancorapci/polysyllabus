# Sprint 3 — Math and Figure Rendering

**Status:** Done

## Goal

Lessons can carry real technical content: LaTeX equations (KaTeX), Mermaid diagrams, and per-lesson figure assets all render in dev and production builds.

## Backlog

- [x] S3-1 Add `remark-math` + `rehype-katex` to the markdown/MDX pipeline and load the KaTeX stylesheet.
- [x] S3-2 Add Mermaid rendering for fenced `mermaid` code blocks (client-side island or script).
- [x] S3-3 Verify per-lesson figure references: relative `fig-*.svg` beside `doc.mdx` resolves through the loader in production builds.
- [x] S3-4 Extend the sample lesson with inline and display equations, one Mermaid diagram, and one SVG figure.

## Acceptance criteria

- Inline (`$...$`) and display (`$$...$$`) math render via KaTeX in the built site.
- A fenced `mermaid` block renders as a diagram, not as code, in the built site.
- Figures load in production builds without manually copying them into `public/`.

## Notes

- Astro 7's default Sätteri processor cannot run remark/rehype plugins, so lessons use the **Unified** processor (`@astrojs/markdown-remark`) via `markdown.processor`. KaTeX has no Sätteri port and Mermaid would need a hand-written plugin.
- Shiki highlights before user rehype plugins and strips the `language-mermaid` class that `rehype-mermaid` matches on. Fix: `syntaxHighlight: { type: "shiki", excludeLangs: ["math", "mermaid"] }` (`math` is the built-in default and must be restated).
- Mermaid renders at build time (zero client JS) via Playwright — hence the `pnpm exec playwright install chromium` prerequisite in `AGENTS.md`.
- KaTeX CSS is imported in the lesson route and bundled by Vite.

## Verification log

- 2026-11-08: built lesson page contains 9 `class="katex"` spans, an inlined `<svg id="mermaid-0">`, and the figure from `/_astro/fig-ohms-law-circuit.*.svg`. Dev server shows the same (10 math/diagram markers). `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
