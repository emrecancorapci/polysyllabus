# Content Components

The complete set of MDX components lessons may use. This file is the contract for generated content.

## Rules for the generation agent

**You may:**

- Use exactly the components below, with the documented props.
- Write Markdown, fenced display math (`$$` on its own lines), and fenced `mermaid` code blocks.
- Place figures (`.svg`, `.png`) and data files (`.json`) beside the lesson's `doc.mdx` and reference them with relative paths (`./fig-*.svg`, `./data-*.json`).
- Use `$…$` inline math in Quiz/NumericQuiz question, options, and explanation strings.

**You may not:**

- Write imports, chart code, JavaScript, or any component outside this set — the build fails on unknown components.
- Hand-edit generated SVG internals beyond the authoring rules below.
- Put `{` `}` or `<br>` (use `<br/>`) inside `<Mermaid>` children — MDX parses them.
- Store answers anywhere except the documented props (they ship in the page source; acceptable for a personal tool).

## `<Figure>`

Numbered, captioned figure. The markdown image child provides source and alt; numbering (`Figure <lesson>.<n>`) is automatic and build-validated.

```mdx
<Figure caption="The simplest complete circuit: one source, one load, one current.">
  ![A voltage source V drives a current I through a resistor R](./fig-ohms-law-circuit.svg)
</Figure>
```

Build fails when: the image child, alt text, or `caption` is missing, or `src` resolves outside the content directory.

**SVG authoring rules (Schemdraw / CircuiTikZ / matplotlib exports):** use `currentColor` for strokes and text, transparent backgrounds, no hard-coded white/black — the site inlines the SVG so the figure follows the light/dark theme. Prefer SVG over PNG (PNGs cannot follow the theme).

## `<Mermaid>`

Block diagrams and flowcharts, rendered at build time (zero client JS). Write the diagram as children; only text and `<br/>` line breaks are allowed.

```mdx
<Mermaid>
  flowchart LR
    A["Source"] --> B["RC network"]
    B --> C["Load"]
</Mermaid>
```

Invalid or empty diagrams fail the build. Fenced ` ```mermaid ` blocks still work; the component form is preferred inside lessons.

## `<Callout>`

| Prop      | Type                                        | Default                   | Description                                         |
| --------- | ------------------------------------------- | ------------------------- | --------------------------------------------------- |
| `variant` | `"note" \| "warning" \| "tip" \| "example"` | `"note"`                  | Icon and styling; `warning` is visually destructive |
| `title`   | `string`                                    | Variant name, capitalized | Heading line                                        |

Children are full Markdown (math, lists). Renders statically.

## `<Quiz>`

Multiple choice with instant feedback. Hydrated on load; result stored per lesson (add `quizId` when a lesson has multiple quizzes).

| Prop          | Type       | Required | Description                               |
| ------------- | ---------- | -------- | ----------------------------------------- |
| `question`    | `string`   | yes      | May contain `$…$` math                    |
| `options`     | `string[]` | yes      | May contain `$…$` math                    |
| `answer`      | `number`   | yes      | Index of the correct option (0-based)     |
| `explanation` | `string`   | yes      | May contain `$…$` math                    |
| `quizId`      | `string`   | no       | Storage key suffix for multi-quiz lessons |

## `<NumericQuiz>`

Exam-style numeric answer with tolerance.

| Prop          | Type                             | Required | Description                                                             |
| ------------- | -------------------------------- | -------- | ----------------------------------------------------------------------- |
| `question`    | `string`                         | yes      | May contain `$…$` math                                                  |
| `answer`      | `number`                         | yes      | Correct value                                                           |
| `tolerance`   | `{ abs?: number; rel?: number }` | yes      | Correct when \|input − answer\| ≤ abs + rel·\|answer\| (either or both) |
| `unit`        | `string`                         | no       | Displayed next to the input                                             |
| `explanation` | `string`                         | yes      | May contain `$…$` math                                                  |
| `quizId`      | `string`                         | no       | Storage key suffix                                                      |

Input accepts `4700`, `4.7e3`, `4.7k`, and resistor-style `4k7` (SI suffixes p n u/µ m k M G T).

## `<DataPlot>`

Line chart from a validated JSON file beside the lesson. Invalid files fail `pnpm build` with the offending fields named.

```mdx
<DataPlot src="./charging-curve.json" />
```

Plain plot schema (Zod, all fields required unless noted):

```json
{
  "type": "plot",
  "title": "Capacitor charging through R",
  "x": { "label": "Time", "unit": "ms", "scale": "linear" },
  "y": { "label": "Capacitor voltage", "unit": "V" },
  "series": [{ "name": "V_C(t)", "points": [[0, 0], [0.02, 0.9]] }]
}
```

- `type`: `"plot"` (default) or `"bode"`
- `scale`: `"linear"` (default) or `"log"`
- `series[]`: `name` (optional, required when multiple series), `points` as `[x, y]` tuples

**Bode preset** (`type: "bode"`): magnitude (dB) and phase (degrees) stacked on one log frequency axis.

```json
{
  "type": "bode",
  "title": "RC low-pass frequency response",
  "frequency": { "label": "Frequency", "unit": "Hz" },
  "magnitude": { "name": "|H(f)|", "points": [[1, 0], [10, -0.1]] },
  "phase": { "name": "∠H(f)", "points": [[1, 0], [10, -0.4]] }
}
```

Data files are produced by the generation pipeline (e.g. Python); the component only validates and renders them. Axes, grids, and labels follow the site theme.

## `<Playground>`

Slider-driven interactive widget from a declarative, build-validated spec. Formulas are mathjs expression strings over the parameter names — evaluated in the browser by mathjs's interpreter (no `eval`/`Function`). Specs that fail to parse, reference unknown symbols, or violate the ranges fail the build.

```mdx
<Playground
  spec={{
    title: "RC low-pass explorer",
    params: [
      { name: "R", symbol: "R", min: 100, max: 10000, step: 100, default: 1000, unit: "Ω" },
      { name: "C", symbol: "C", min: 10, max: 1000, step: 10, default: 100, unit: "nF" }
    ],
    outputs: [
      { name: "Cutoff frequency", formula: "1 / (2 * pi * R * C * 1e-9)", unit: "Hz" }
    ],
    plot: {
      x: { variable: "f", label: "Frequency", unit: "Hz", min: 1, max: 1000000, log: true },
      y: { formula: "-10 * log10(1 + (2 * pi * f * R * C * 1e-9)^2)", label: "Magnitude", unit: "dB" }
    }
  }}
/>
```

Spec rules: `params[].name` unique, `min < max`, `default` within range; `plot.x.variable` must not collide with a parameter name; every formula must produce a finite number at the defaults.

## `<CollapsibleSolution>`

Native disclosure, no JavaScript. Children are full Markdown (math allowed).

| Prop    | Type     | Default      | Description  |
| ------- | -------- | ------------ | ------------ |
| `title` | `string` | `"Solution"` | Summary line |
