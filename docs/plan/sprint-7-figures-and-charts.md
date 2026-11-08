# Sprint 7 — Figures and Charts

**Status:** In progress

## Goal

Lessons can carry real EEE study material: math inside interactive components, numbered figures, diagrams, data-driven plots (including a Bode preset), a parameter playground, and numeric-answer quizzes — all through the documented, validated component contract.

## Backlog

- [ ] S7-1 **KaTeX inside components.** Math in serialized props (Quiz options/explanations) is not processed by the markdown pipeline; render it with KaTeX inside the island via a shared `MathText` helper. Verify math in `Callout` and `CollapsibleSolution` children (these go through the pipeline). Add a math-heavy quiz case to the sample lesson.
- [ ] S7-2 **`<Figure>`.** Markdown-image child (`![alt](./fig.svg)`) beside the `doc.mdx`; required alt and caption; automatic per-lesson numbering ("Figure 2.1" = lesson order.figure index) injected by a rehype plugin. SVGs are inlined at build so `currentColor` follows the theme — document authoring rules (currentColor, transparent background) for generated SVGs.
- [ ] S7-3 **`<Mermaid>`.** Component form of the fenced `mermaid` block; a rehype plugin rewrites it to a code block before `rehype-mermaid`, keeping rendering at build time. Invalid or empty diagrams fail the build.
- [ ] S7-4 **`<DataPlot src="./data.json" />`.** JSON validated with Zod at build (title, labeled axes with units and linear/log scale, series of x/y points); invalid files fail `pnpm build`. Rendered with **Observable Plot** (justification in Notes), hydrated `client:visible`.
- [ ] S7-5 **Bode preset.** `type: "bode"` extension of the DataPlot schema: magnitude (dB) and phase (degrees) stacked on a shared log-frequency axis.
- [ ] S7-6 **`<Playground>`.** Declarative spec (Zod-validated at build): slider parameters, formula-string outputs, one output-vs-variable plot. Formulas evaluated in the browser with mathjs (its own interpreter — no `eval`/`Function`), lazily imported. Example: RC low-pass filter with R/C sliders moving the cutoff and magnitude plot.
- [ ] S7-7 **Numeric-answer quiz.** Correct value, absolute or relative tolerance, unit display, explanation; accepts engineering input forms (`4.7k`, `4700`, `4.7e3`, `4k7`). Result recorded in the progress store under a quiz id. Multi-select quizzes are deferred to Sprint 8 (see `sprint-8.md`).
- [ ] S7-8 **Docs and sample lesson.** Update `docs/content-components.md` with props, schemas, examples, and generation-agent rules; use every new component in the sample lessons; register components in the lesson route's components map.

## Acceptance criteria

- Every new component renders and hydrates with no console errors in both `pnpm dev` and the built site.
- Math renders correctly in the lesson body, Callout, CollapsibleSolution, and Quiz (options and explanations).
- An invalid data file, Playground spec, or Mermaid diagram fails `pnpm build` with a readable error.
- Plots and figures are readable in light and dark mode.
- `pnpm lint`, `pnpm format`, `pnpm typecheck` and `pnpm build` all pass.

## Notes

- **Plot library: Observable Plot.** SVG output (themeable via `currentColor`), a fraction of Plotly's bundle size, and a declarative API that fits the validated-JSON → plot mapping. Plotly's "basic" bundle is still ~1 MB and canvas-rendered (no CSS theming).
- Chart series colors come from Plot's built-in scheme (data semantics, not UI chrome); axes, grids, and labels use `currentColor` so they follow the design tokens in both themes.
- Mermaid renders at build time (Sprint 3 pipeline); class-based dark mode cannot be seen by the generated SVG, so dark mode applies an `invert(1) hue-rotate(180deg)` filter. Figures avoid this entirely by inlining SVGs that use `currentColor`.
- Figures are inlined via an eager `import.meta.glob('...?raw')` over `src/docs/courses/**/*.svg`; PNGs fall back to `?url` `<img>` (raster figures cannot follow the theme — SVG is the documented default).
- Quiz math requires KaTeX in the client bundle; it is only loaded on pages with quizzes (`client:visible` islands).
- The rehype plugin (`src/plugins/rehype-content.ts`) also resolves relative `src` props to absolute paths and validates figures; it runs before `rehype-mermaid` in the shared unified config so both MDX and plain Markdown get it.
- Formula safety: specs are parsed with `math.parse` and evaluated once with default parameters at build — undefined symbols and syntax errors fail the build.
- Dark-mode toggle added this sprint (class-based, persisted, OS-aware default) since the site had no way to verify dark rendering.

## Verification log

- (pending)
