# Sprint 8 — Backlog

**Status:** In progress

## Goal

Carry deferred stories from Sprint 7 and the next round of improvements.

## Backlog

- [ ] S8-1 **Multi-select quizzes.** Extend `<Quiz>` with `multiple: true` (checkbox options, several correct indexes, all-or-nothing or partial scoring — decide and document). Deferred from Sprint 7's S7-7.
- [x] S8-2 **Course metadata.** Done 2026-11-09: `course.json` per course (Zod-validated `title`, `summary?`, `category`, `subCategory`, `difficulty` enum) in a new `courses` collection; a course with lessons and no metadata fails the build; home page groups by category; course page shows the taxonomy and difficulty; slug humanization removed. Documented in `docs/lesson-authoring.md`.
- [ ] S8-3 **Content pipeline hardening.** The generation pipeline will produce lessons in bulk: add a CI workflow running lint/typecheck/build on push, since content errors only surface at build.
- [ ] S8-4 **Clean math copy-paste.** Copying text that contains math yields duplicated content (hidden MathML + annotation + visible HTML — standard KaTeX). This KaTeX version ships no copy-tex CSS; the `katex/contrib/copy-tex` JS module needs loading via a client script that intercepts copy events.

## Verification log

- 2026-11-09 (S8-2): missing `course.json` fails the build with `[courses] missing course metadata: create …`; invalid difficulty fails with the enum options listed; home page renders the "Tech" category group with subcategory and difficulty chip; course page shows `Tech → Electronics` meta; lesson titles use the metadata title. `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
