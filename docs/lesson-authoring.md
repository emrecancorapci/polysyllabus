# Lesson Authoring Guide

For agents (and humans) producing course material. The component props live in `docs/content-components.md`; this guide covers everything else: structure, frontmatter, authoring rules, failure modes, and verification.

**Golden rule: content never contains imports, chart code, or JavaScript.** You write Markdown, MDX components with validated props, and data files. Everything else fails `pnpm build`.

## Where material lives

```
src/docs/courses/<course-slug>/<n>-<module-slug>/
  doc.mdx                 # the lesson (required, exact name)
  fig-*.svg               # figures, beside the lesson
  *.json                  # plot data, beside the lesson
```

- The folder name is the lesson's identity: `dc-circuits/3-rc-low-pass-filter`. It forms the URL (`/courses/dc-circuits/3-rc-low-pass-filter/`) and the id used by prerequisites and progress storage. Slugs are permanent — do not rename published lessons.
- `doc.mdx` is the only file the loader picks up; other files are assets.
- Courses are implicit: the first path segment groups lessons. All lessons of a course must share the prefix.

## Frontmatter

```yaml
---
title: "The RC Low-Pass Filter"
order: 3
summary: "One sentence describing the lesson."
prerequisites: ["dc-circuits/1-ohms-law", "dc-circuits/2-kirchhoffs-laws"]
learningObjectives:
  - "Explain why …"
  - "Compute …"
estimatedTime: 30
needsReview: false
---
```

| Field                | Rules                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `title`              | Plain text, no math                                                                          |
| `order`              | Positive integer, unique within the course; drives course page, sidebar, and prev/next order |
| `summary`            | One sentence; shown on course cards                                                          |
| `prerequisites`      | Lesson ids (`<course>/<slug>`); resolve to titles automatically; `[]` for the first lesson   |
| `learningObjectives` | **Plain text only — they are not math-rendered.** Use Unicode: `fc = 1/(2πRC)`, `τ = RC`     |
| `estimatedTime`      | Integer minutes                                                                              |
| `needsReview`        | `true` flags the lesson as needing a human pass                                              |

Frontmatter is validated by Zod at build; wrong types fail with `[InvalidContentEntryDataError]` naming the field.

## Math

- Inline: `$V = IR$` anywhere in the body.
- Display equations must use the **fenced form** — `$$` on its own line, equation, `$$`. A single-line `$$…$$` silently renders as small _inline_ math:

  ```markdown
  $$
  f_c = \frac{1}{2 \pi R C}
  $$
  ```

- In component string props (Quiz/NumericQuiz `question`, `options`, `explanation`), write LaTeX with **single backslashes**: `$R = 1\,\text{k}\Omega$`.
- Frontmatter fields (objectives, summary) are not math-rendered — use Unicode symbols there.

## Components

The allowed set and every prop are documented in `docs/content-components.md`: `Callout`, `Quiz`, `NumericQuiz`, `CollapsibleSolution`, `Figure`, `Mermaid`, `DataPlot`, `Playground`. Rules that bite:

- Components are available **without imports**. Anything outside the set fails the build with "`X` is not defined".
- `Figure`: the markdown image is a **child**; alt and `caption` are required; numbering is automatic (`Figure 3.1` = lesson order + sequence). Never hand-write figure numbers.
- `Mermaid` children are JSX: use `<br/>` (never `<br>`), and never `{` or `}`. Use ASCII arrows (`-->`), not Unicode dashes. The fenced ` ```mermaid ` form avoids all JSX parsing if a diagram needs braces.
- `Quiz`/`NumericQuiz` results are stored per lesson; add a `quizId` to both when a lesson has more than one quiz.
- `Playground` specs are validated at build: ranges (`min < max`, `default` inside), unique parameter names, `plot.x.variable` distinct from parameter names, and every formula must parse and produce a finite number at the defaults.

## Figures (SVG authoring rules)

Generated figures (Schemdraw, CircuiTikZ, matplotlib exports) must be readable in light and dark mode:

- `stroke`/`fill` = `currentColor` for strokes and text; **no hard-coded black or white**.
- Transparent background (no white rect).
- Include a `viewBox`; no fixed `width`/`height` (the site scales the figure).
- PNG cannot follow the theme — use SVG unless there is no alternative.

## Data files

`DataPlot` reads JSON beside the lesson; schemas are in `docs/content-components.md`. The numbers are produced **outside the doc** (Python, numpy, etc.) and only rendered here. Requirements:

- Points as `[x, y]` tuples of plain numbers, sorted by x.
- For `type: "bode"`: magnitude in dB, phase in degrees, frequency in Hz, same frequency grid for both panels (shared log axis).
- Compute values — never eyeball curves. A Bode file is ~50–100 log-spaced points per decade span.

## Common failure modes

| Build error                                                                                | Cause                                             | Fix                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------ |
| `[InvalidContentEntryDataError] … <field>`                                                 | Wrong/missing frontmatter type                    | Correct the field                          |
| `` `X` is not defined ``                                                                   | Unknown component or misspelled name              | Use only the documented set                |
| `[content] <Figure> … missing alt text / the caption prop / must contain a markdown image` | Figure misuse                                     | `![alt](./fig.svg)` child + `caption` prop |
| `[DataPlot] invalid data file …: <path in schema>`                                         | JSON schema violation                             | Fix the named fields                       |
| `[DataPlot] file not found`                                                                | Wrong relative path or file not beside the lesson | Check the path                             |
| `[Playground] … Undefined symbol <name>`                                                   | Typo'd variable in a formula                      | Fix the formula                            |
| mermaid `Parse error on line N`                                                            | Invalid diagram syntax                            | Fix the diagram                            |
| `Expected a closing tag for <br>`                                                          | `<br>` inside JSX children                        | Use `<br/>`                                |

## Verification checklist

Before marking a lesson done:

1. `pnpm build` passes (this validates frontmatter, figures, data files, specs, diagrams, and components).
2. **Numeric results are verified** — recompute every worked example and quiz answer independently (do not copy numbers between the two). Quiz answers must sit inside their tolerance; check the tolerance makes sense (±2 % of the value, or an absolute value that matches the significant figures given).
3. Open the lesson in the browser (`pnpm dev` or `astro preview --background`): display math is centered and full-size, figures render in light and dark mode, each quiz answers correctly _and_ incorrectly.
4. Data files: spot-check first/last points against the formula.
5. Commit per repo conventions (`AGENTS.md`): content insertion is exempt from the size limit; imperative Conventional Commits, e.g. `feat(content): add series-parallel resistors lesson`.

## Authoring checklist for a new lesson

- [ ] Folder `<course>/<n>-<slug>/` with `doc.mdx` named exactly.
- [ ] Frontmatter complete; `order` continues the course sequence; `prerequisites` point at real lesson ids.
- [ ] Objectives in plain text (Unicode math).
- [ ] Display math fenced; inline math single-`$`.
- [ ] Figures as `<Figure>` with alt + caption; SVGs follow the theme rules.
- [ ] At least one `Quiz` or `NumericQuiz`; math in props with single backslashes.
- [ ] Data files computed externally and validated by the build.
- [ ] `pnpm build` green; browser check done; numbers verified.
