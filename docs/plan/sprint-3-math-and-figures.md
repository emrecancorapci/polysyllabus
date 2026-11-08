# Sprint 3 — Math and Figure Rendering

**Status:** Not started

## Goal

Lessons can carry real technical content: LaTeX equations (KaTeX), Mermaid diagrams, and per-lesson figure assets all render in dev and production builds.

## Backlog

- [ ] S3-1 Add `remark-math` + `rehype-katex` to the markdown/MDX pipeline and load the KaTeX stylesheet.
- [ ] S3-2 Add Mermaid rendering for fenced `mermaid` code blocks (client-side island or script).
- [ ] S3-3 Verify per-lesson figure references: relative `fig-*.svg` beside `doc.mdx` resolves through the loader in production builds.
- [ ] S3-4 Extend the sample lesson with inline and display equations, one Mermaid diagram, and one SVG figure.

## Acceptance criteria

- Inline (`$...$`) and display (`$$...$$`) math render via KaTeX in the built site.
- A fenced `mermaid` block renders as a diagram, not as code, in the built site.
- Figures load in production builds without manually copying them into `public/`.
