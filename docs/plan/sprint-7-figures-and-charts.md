# Sprint 7 — Figures and Charts

**Status:** Done

## Goal

Lessons can carry real EEE study material: math inside interactive components, numbered figures, diagrams, data-driven plots (including a Bode preset), a parameter playground, and numeric-answer quizzes — all through the documented, validated component contract.

## Backlog

- [x] S7-1 **KaTeX inside components.** Math in serialized props (Quiz options/explanations) is not processed by the markdown pipeline; render it with KaTeX inside the island via a shared `MathText` helper. Verify math in `Callout` and `CollapsibleSolution` children (these go through the pipeline). Add a math-heavy quiz case to the sample lesson.
- [x] S7-2 **`<Figure>`.** Markdown-image child (`![alt](./fig.svg)`) beside the `doc.mdx`; required alt and caption; automatic per-lesson numbering ("2.1" = lesson order.figure index) injected by a rehype plugin. SVGs are inlined at build so `currentColor` follows the theme; authoring rules documented.
- [x] S7-3 **`<Mermaid>`.** Component form of the fenced `mermaid` block; a rehype plugin rewrites it to a code block before `rehype-mermaid`, keeping rendering at build time. Invalid or empty diagrams fail the build.
- [x] S7-4 **`<DataPlot src="./data.json" />`.** JSON validated with Zod at build (title, labeled axes with units and linear/log scale, series of x/y points); invalid files fail `pnpm build`. Rendered with Observable Plot, hydrated `client:visible`.
- [x] S7-5 **Bode preset.** `type: "bode"` extension of the DataPlot schema: magnitude (dB) and phase (degrees) stacked on a shared log-frequency axis.
- [x] S7-6 **`<Playground>`.** Declarative spec (Zod-validated at build): slider parameters, formula-string outputs, one output-vs-variable plot. Formulas evaluated in the browser with mathjs (lazily imported; no `eval`/`Function`). RC low-pass explorer added to the sample lesson.
- [x] S7-7 **Numeric-answer quiz.** Correct value, absolute/relative tolerance, unit display, explanation; accepts `4.7k`, `4700`, `4.7e3`, `4k7`; result stored under `lessonId#quizId` (with `quizId` support added to the multiple-choice quiz for multi-quiz lessons). Multi-select quizzes deferred to Sprint 8.
- [x] S7-8 **Docs and sample lesson.** `docs/content-components.md` documents every component with props, schemas, examples, and generation-agent rules; lesson 3 uses Figure, Mermaid, both DataPlot types, Playground, and NumericQuiz; all rendering components registered in the components map.

## Acceptance criteria

- Every new component renders and hydrates with no console errors in both `pnpm dev` and the built site.
- Math renders correctly in the lesson body, Callout, CollapsibleSolution, and Quiz (options and explanations).
- An invalid data file, Playground spec, or Mermaid diagram fails `pnpm build` with a readable error.
- Plots and figures are readable in light and dark mode.
- `pnpm lint`, `pnpm format`, `pnpm typecheck` and `pnpm build` all pass.

## Notes

- **Plot library: Observable Plot.** SVG output (themeable via `currentColor`), a fraction of Plotly's bundle size, and a declarative API that fits the validated-JSON → plot mapping. Plotly's "basic" bundle is still ~1 MB and canvas-rendered (no CSS theming).
- Chart series use Plot's categorical scheme (data semantics, not UI chrome); axes, grids, and labels use `currentColor` so they follow the tokens in both themes.
- Mermaid renders at build time (Sprint 3 pipeline); class-based dark mode cannot be seen by the generated SVG, so dark mode applies an `invert(1) hue-rotate(180deg)` filter (`global.css`). Figures avoid this entirely by inlining currentColor SVGs.
- **Smart punctuation is off for the content pipeline** (`unified({ smartypants: false })`): it mangles Mermaid arrows (`-->` → `—>`) and quotes inside `<Mermaid>` children (fenced code blocks were always exempt). Cost: no typographic quotes in lesson prose.
- MDX parses component children as JSX: `<br/>` (not `<br>`) inside `<Mermaid>`, and `{`/`}` are not allowed there.
- Quiz math needs KaTeX in the client bundle (only loaded on pages with quizzes); `MathText` renders mixed text+math deterministically so SSR and hydration match.
- The rehype plugin (`src/plugins/rehype-content.ts`) validates figures, resolves relative srcs to repo-absolute paths (Figure and DataPlot), numbers figures per lesson via frontmatter order, and rewrites `<Mermaid>` to code blocks. It runs before `rehype-mermaid` in the shared unified config.
- Formula safety: Playground specs are parsed and evaluated with defaults at build — syntax errors, unknown symbols, and non-finite results fail the build.
- Progress keys: multiple-choice keeps the Sprint 6 key (lesson id) when no `quizId` is given; `NumericQuiz` stores under `lessonId#numeric` or `lessonId#quizId`.
- Dark-mode toggle (class-based, persisted, OS-aware default) added this sprint; `ThemeInit` runs inline before first paint to avoid a flash.

## Verification log

- 2026-11-08, failure paths (all fail `pnpm build` with readable errors naming the file and reason): invalid Mermaid syntax (mermaid parse error); `<Figure>` missing caption / missing alt; invalid DataPlot JSON (`y.label: expected string; series.0.points.0.0: expected number`); Playground formula with typo (`Undefined symbol Cx`).
- 2026-11-08, built site (headless): Playground slider R 1 kΩ→5 kΩ updates cutoff readout 1592 Hz→318.3 Hz and redraws the curve; NumericQuiz accepts `1.59k` (Correct.) and rejects `12` with feedback + explanation; MC quiz correct feedback; math renders in quiz options/explanations, Callout, and CollapsibleSolution. Dark mode: toggle persists (`study-helper:theme`), background oklch(0.145), figure strokes and plot labels flip oklch(0.145)↔oklch(0.985), Mermaid filter `invert(1) hue-rotate(180deg)`. Zero console errors.
- 2026-11-08, dev server: same playground behavior (318.3 Hz), toggle works, zero console errors.
- 2026-11-08: `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass (6 pages).
