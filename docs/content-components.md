# Content Components

The complete set of MDX components lessons may use. This file is the contract for generated content.

- Components are available in every lesson **without imports**; the renderer injects them.
- Any component outside this set fails `astro build` — do not invent ad-hoc components in content.
- Only Markdown and these components are allowed in `doc.mdx` bodies.

## `<Callout>`

A highlighted aside. Renders statically (no JavaScript).

| Prop      | Type                                        | Default                   | Description                                         |
| --------- | ------------------------------------------- | ------------------------- | --------------------------------------------------- |
| `variant` | `"note" \| "warning" \| "tip" \| "example"` | `"note"`                  | Icon and styling; `warning` is visually destructive |
| `title`   | `string`                                    | Variant name, capitalized | Heading line                                        |

Children: the body (Markdown allowed).

```mdx
<Callout variant="warning" title="Mind the polarity">
  Electrolytic capacitors are polarized; reverse bias can destroy them.
</Callout>
```

## `<Quiz>`

A multiple-choice question with instant feedback. Hydrated on load (React island).

| Prop          | Type       | Required | Description                              |
| ------------- | ---------- | -------- | ---------------------------------------- |
| `question`    | `string`   | yes      | The question text                        |
| `options`     | `string[]` | yes      | Answer options, rendered as buttons      |
| `answer`      | `number`   | yes      | Index of the correct option (0-based)    |
| `explanation` | `string`   | yes      | Shown after answering, for both outcomes |

One attempt per page view (Sprint 6 adds persisted scores).

```mdx
<Quiz
  question="A 9 V battery is connected across a 1.8 kΩ resistor. How much current flows?"
  options={["5 mA", "50 mA", "500 mA", "2 A"]}
  answer={0}
  explanation="I = V / R = 9 V / 1800 Ω = 5 mA."
/>
```

> Answers ship in the page source (serialized props). Acceptable for a personal study tool; revisit before using this as a product.

## `<CollapsibleSolution>`

Content hidden behind a native disclosure; no JavaScript, works without hydration.

| Prop    | Type     | Default      | Description  |
| ------- | -------- | ------------ | ------------ |
| `title` | `string` | `"Solution"` | Summary line |

Children: the hidden body (Markdown and math allowed).

```mdx
<CollapsibleSolution title="Solution">
  Resistance: $R = V / I = 57.5\,\Omega$.
</CollapsibleSolution>
```
