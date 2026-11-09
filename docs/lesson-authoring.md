# Lesson Authoring Guide

For agents (and humans) producing course material. The component props live in `docs/content-components.md`; this guide covers everything else: structure, frontmatter, authoring rules, failure modes, and verification.

**Golden rule: content never contains imports, chart code, or JavaScript.** You write Markdown, MDX components with validated props, and data files. Everything else fails `pnpm build`.

## Where material lives

```
src/docs/courses/<course-slug>/
  course.json                     # course metadata (required, exact name)
  <n>-<lesson-slug>/              # lesson = a chapter of 20 to 40 minutes
    lesson.json                   # lesson metadata (required, exact name)
    <p>-<part-slug>/              # part = a study page of at most 10 minutes
      doc.mdx                     # the part (required, exact name)
      fig-*.svg                   # figures, beside the part that uses them
      *.json                      # plot data, beside the part that uses it
```

- The full path is `category → subCategory → course → lesson → part`, e.g. `Tech → Electronics → Analog Electronics → The Common-Emitter Amplifier → Why amplify with a transistor?`.
- The part folder is the permanent id: `analog-electronics/1-common-emitter-amplifier/1-why-amplify`. It forms the URL (`/courses/<course>/<lesson>/<part>/`) and the id used by prerequisites and progress storage. Never rename published folders.
- A part covers exactly one concept and takes **at most 10 minutes**; the build rejects longer `estimatedTime`. Split, do not shrink the coverage.
- Prefer question-style part titles ("Why amplify with a transistor?"). A reader should know what a part answers from the title alone.
- Lessons group parts into a chapter: 20 to 40 minutes each, ordered by `lesson.json`.

## Course and lesson metadata

Every course **must** have a `course.json`, and every lesson **must** have a `lesson.json`, or the build fails with a message naming the missing file.

`course.json` declares the taxonomy — the site groups courses by category on the home page:

```json
{
  "title": "DC Circuits",
  "summary": "Foundations of DC circuit analysis.",
  "category": "Tech",
  "subCategory": "Electronics",
  "difficulty": "beginner"
}
```

| Field         | Rules                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `title`       | Display name; replaces slug humanization                              |
| `summary`     | Optional one-liner for the home and course pages                      |
| `category`    | Top-level topic, e.g. `Tech`, `Philosophy`, `Art`                     |
| `subCategory` | Topic within the category, e.g. `Electronics`, `Political Philosophy` |
| `difficulty`  | `"beginner"`, `"intermediate"`, or `"advanced"`                       |

`lesson.json` declares the chapter:

```json
{
  "title": "The Common-Emitter Amplifier",
  "order": 1,
  "summary": "Bias a transistor and compute the gain of a common-emitter stage."
}
```

| Field     | Rules                                       |
| --------- | ------------------------------------------- |
| `title`   | Display name of the lesson                  |
| `order`   | Unique positive integer within the course   |
| `summary` | Optional one-liner shown on the course page |

## Part frontmatter

```yaml
---
title: "Why amplify with a transistor?"
order: 1
summary: "One sentence describing the part."
prerequisites: ["analog-electronics/1-common-emitter-amplifier/1-why-amplify"]
learningObjectives:
  - "Explain why …"
  - "Compute …"
estimatedTime: 4
needsReview: false
---
```

| Field                | Rules                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `title`              | Plain text, no math; question style preferred                                             |
| `order`              | Positive integer, unique within the lesson; drives sidebar and prev/next order            |
| `summary`            | One sentence; shown on the course page                                                    |
| `prerequisites`      | Part ids (`<course>/<lesson>/<part>`); resolve to links automatically; `[]` for the first |
| `learningObjectives` | May contain `$…$` inline math (rendered with KaTeX); plain Unicode (`τ = RC`) also works  |
| `estimatedTime`      | Integer minutes, **1 to 10**; longer parts fail the build                                 |
| `needsReview`        | `true` flags the part as needing a human pass                                             |

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
- `summary` and `title` are plain text; objectives may use `$…$` math.

## Components

The allowed set and every prop are documented in `docs/content-components.md`: `Callout`, `Quiz`, `NumericQuiz`, `CollapsibleSolution`, `Figure`, `Mermaid`, `DataPlot`, `Playground`. Rules that bite:

- Components are available **without imports**. Anything outside the set fails the build with "`X` is not defined".
- `Figure`: the markdown image is a **child**; alt and `caption` are required; numbering is automatic (`Figure 3.2.1` = lesson order, part order, figure index). Never hand-write figure numbers.
- `Mermaid` children are JSX: use `<br/>` (never `<br>`), and never `{` or `}`. Use ASCII arrows (`-->`), not Unicode dashes. The fenced ` ```mermaid ` form avoids all JSX parsing if a diagram needs braces.
- `Quiz`/`NumericQuiz` results are stored per lesson; add a `quizId` to both when a lesson has more than one quiz.
- `Playground` specs are validated at build: ranges (`min < max`, `default` inside), unique parameter names, `plot.x.variable` distinct from parameter names, and every formula (outputs, marker positions) must parse and produce a finite number at the defaults. Parameters with `log: true` render as logarithmic sliders (positive min/max, `step` optional — used to snap to component values); use them for quantities that span decades (R, C, f).
- Mermaid labels are **not** KaTeX-rendered: use Unicode (`√2`, `π`, `−20 dB`) or `<sub>`/`<sup>` HTML — but HTML tags require the fenced ` ```mermaid ` form, since the `<Mermaid>` component only accepts text and `<br/>` children.

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

| Build error                                                                                | Cause                                             | Fix                                                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------- |
| `[InvalidContentEntryDataError] … <field>`                                                 | Wrong/missing frontmatter or metadata type        | Correct the field                                             |
| `[courses] missing course metadata: …`                                                     | A course has parts but no `course.json`           | Create the file with title, category, subCategory, difficulty |
| `[courses] missing lesson metadata: …`                                                     | A lesson has parts but no `lesson.json`           | Create the file with title and order                          |
| `` `X` is not defined ``                                                                   | Unknown component or misspelled name              | Use only the documented set                                   |
| `[content] <Figure> … missing alt text / the caption prop / must contain a markdown image` | Figure misuse                                     | `![alt](./fig.svg)` child + `caption` prop                    |
| `[DataPlot] invalid data file …: <path in schema>`                                         | JSON schema violation                             | Fix the named fields                                          |
| `[DataPlot] file not found`                                                                | Wrong relative path or file not beside the lesson | Check the path                                                |
| `[Playground] … Undefined symbol <name>`                                                   | Typo'd variable in a formula                      | Fix the formula                                               |
| mermaid `Parse error on line N`                                                            | Invalid diagram syntax                            | Fix the diagram                                               |
| `Expected a closing tag for <br>`                                                          | `<br>` inside JSX children                        | Use `<br/>`                                                   |

## Verification checklist

Before marking a lesson done:

1. `pnpm build` passes (this validates frontmatter, metadata, figures, data files, specs, diagrams, and components).
2. **Numeric results are verified** — recompute every worked example and quiz answer independently (do not copy numbers between the two). Quiz answers must sit inside their tolerance; check the tolerance makes sense (±2 % of the value, or an absolute value that matches the significant figures given).
3. Open the parts in the browser (`pnpm dev` or `astro preview --background`): display math is centered and full-size, figures render in light and dark mode, each quiz answers correctly _and_ incorrectly.
4. Data files: spot-check first/last points against the formula.
5. Commit per repo conventions (`AGENTS.md`): content insertion is exempt from the size limit; imperative Conventional Commits, e.g. `feat(content): add common emitter lesson parts`.

## Authoring checklist for a new lesson

- [ ] `lesson.json` with `title`, `order`, optional `summary`; every part at most 10 minutes, one concept each.
- [ ] Part folders `<p>-<slug>/` with `doc.mdx` named exactly; `order` unique within the lesson.
- [ ] Part `prerequisites` point at real part ids; every prerequisite comes earlier.
- [ ] Objectives checked (math renders if used).
- [ ] Display math fenced; inline math single-`$`.
- [ ] Figures as `<Figure>` with alt + caption; SVGs follow the theme rules; assets sit beside the part that uses them.
- [ ] At least one `Quiz` or `NumericQuiz` per lesson; math in props with single backslashes.
- [ ] Data files computed externally and validated by the build.
- [ ] `pnpm build` green; browser check done; numbers verified.
