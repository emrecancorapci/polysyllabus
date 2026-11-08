# Sprint 5 — Interactive MDX Components

**Status:** Done

## Goal

Lessons support a small, documented set of interactive components — callouts, quizzes, collapsible solutions — as React islands, with no ad-hoc components inside content.

## Backlog

- [x] S5-1 `<Callout>` with variants (note, warning, tip, example).
- [x] S5-2 `<Quiz>` multiple-choice island: options, correct answer, brief explanation, correct/incorrect feedback.
- [x] S5-3 `<CollapsibleSolution>` island.
- [x] S5-4 Document the allowed component set (props and usage) in `docs/content-components.md` as the contract for generated content.
- [x] S5-5 Use every component at least once in the sample lesson.

## Acceptance criteria

- Every component renders and hydrates without console errors in dev and in the built site.
- Quizzes give correct/incorrect feedback on selection.
- The sample lesson uses only documented components; the component list is written down in-repo.

## Notes

- Components are injected via `<Content components={contentComponents} />` — content needs no imports, and anything outside the map fails the build, which enforces the contract.
- Split by interactivity: `Callout` (Alert-based, static) and `CollapsibleSolution` (native `<details>`, static) are Astro components with zero client JS; only `Quiz` hydrates (`client:load` via its `.astro` wrapper passing props to the React island).
- Callout builds on shadcn `Alert` (added via CLI); variants map to lucide icons + titles, `warning` uses the destructive variant. No raw status colors — semantic tokens only.
- Quiz answers ship in serialized props (page source) — noted in `docs/content-components.md`.
- The components map lives in the lesson route's frontmatter, not a `.ts` module: typescript-eslint's project service cannot resolve `.astro` imports from `.ts` (plain tsc can, via `src/env.d.ts`, but the tools disagree) — wiring stays inside `.astro` files.

## Verification log

- 2026-11-08: headless-browser check on the built lesson page — both callouts render (`Think in pairs`, `Warning`), solution `<details>` toggles open natively, quiz hydrates: wrong answer clicked → "Not quite." + explanation shown, wrong option marked destructive, correct option highlighted, options disabled. Zero console errors. `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
