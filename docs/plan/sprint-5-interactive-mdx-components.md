# Sprint 5 — Interactive MDX Components

**Status:** Not started

## Goal

Lessons support a small, documented set of interactive components — callouts, quizzes, collapsible solutions — as React islands, with no ad-hoc components inside content.

## Backlog

- [ ] S5-1 `<Callout>` with variants (note, warning, tip, example).
- [ ] S5-2 `<Quiz>` multiple-choice island: options, correct answer, brief explanation, correct/incorrect feedback.
- [ ] S5-3 `<CollapsibleSolution>` island.
- [ ] S5-4 Document the allowed component set (props and usage) in `docs/content-components.md` as the contract for generated content.
- [ ] S5-5 Use every component at least once in the sample lesson.

## Acceptance criteria

- Every component renders and hydrates without console errors in dev and in the built site.
- Quizzes give correct/incorrect feedback on selection.
- The sample lesson uses only documented components; the component list is written down in-repo.

## Notes

- Quiz answers ship in the page source (serialized props). Acceptable for a personal study tool; revisit if this becomes a product.
