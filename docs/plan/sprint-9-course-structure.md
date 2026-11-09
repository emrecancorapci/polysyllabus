# Sprint 9 — Course Structure: Lessons and Parts

**Status:** Done

## Goal

Courses get a second content level. A course contains **lessons** (chapters, ~20–40 min) and each lesson contains **parts** (study pages, ≤10 min):

`Category → SubCategory → Course → Lesson → Part`, e.g. `Tech → Electronics → Analog Electronics → The Common-Emitter Amplifier → Why amplify with a transistor?`

## Backlog

- [x] S9-1 **Schema and library.** New `lessons` collection over `*/*/lesson.json` (`title`, `order`, `summary?`); `doc.mdx` collection becomes `parts` (ids `course/lesson/part`, `estimatedTime` capped at 10); `src/lib/courses.ts` rebuilt around Course → Lesson → Part with readable build errors for missing `course.json`/`lesson.json`.
- [x] S9-2 **Routes and UI.** Part route `/courses/<course>/<lesson>/<part>/` with breadcrumb Home / Course / Lesson / Part; course page lists lessons with their parts; sidebar outline grouped by lesson with `L.P` numbering; prev/next flows across parts and lesson boundaries; progress (bar, complete button, quiz keys) moves to part ids; 404 copy updated.
- [x] S9-3 **Figure numbering.** `Figure <lesson>.<part>.<n>` — the rehype plugin reads the lesson's order from `lesson.json`.
- [x] S9-4 **Content migration.** All three courses restructured: `analog-electronics` split into seven parts (the user's two example titles are parts 1–2); `dc-circuits` and `communism` lessons became lesson folders with short parts; assets moved with their parts; prerequisites point at part ids.
- [x] S9-5 **Factory behaviour.** Outliner designs lessons of 20–40 min and their ≤10-minute parts (question-style, single-concept titles); Writer writes `lesson.json` plus one folder per part; Integrator copies lesson folders and screenshots a part page; `run_claims.py` reads claim texts from all part files; factory `AGENTS.md` and the sample course follow the new layout.
- [x] S9-6 **Docs.** `docs/lesson-authoring.md`, root `AGENTS.md` content structure, and `docs/content-components.md` describe the part contract.

## Acceptance criteria

- Every part page renders at `/courses/<course>/<lesson>/<part>/` with the four-level breadcrumb.
- No part exceeds 10 minutes; `estimatedTime > 10` fails `pnpm build`.
- A course with parts but no `lesson.json` (or no `course.json`) fails the build with a message naming the file to create.
- Sidebar, prev/next, prerequisites, progress, and figure numbering all follow the new hierarchy.
- Existing quiz/plot/playground/figure behaviour unchanged on migrated content.
- `pnpm lint`, `pnpm lint:content`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.

## Notes

- Terminology: **lesson** = chapter (`lesson.json`), **part** = the study page (`doc.mdx`). The `lessons` collection holds lesson metadata; part entries live in the `parts` collection.
- Progress keys become part ids (`course/lesson/part`); old two-segment keys are orphaned (acceptable for a personal tool, noted here).
- Prerequisites reference part ids and resolve to linked part titles; a prerequisite on a lesson's last part implies "the whole lesson".
- A failed `astro build` can leave `dist` gutted; rebuild before `astro preview` after any failed build.

## Verification log

- 2026-11-09: failure paths — `estimatedTime: 12` fails with `estimatedTime: Too big: expected number to be <=10`; removing a `lesson.json` fails the build (figure plugin for lessons with figures, `[courses] missing lesson metadata` otherwise).
- 2026-11-09, built site (headless): part page breadcrumb reads Home / Analog Electronics / The Common-Emitter Amplifier / Why amplify with a transistor?; sidebar lists all 7 CE parts numbered `1.1`–`1.7` with exactly one `aria-current`; Next walks the whole lesson (6 hops to part 7); prev/next crosses the lesson boundary (`3-power-and-practice` → `2-kirchhoffs-laws/1-kcl`); completing a part persists after reload and the course page shows "1 of 7 parts completed" with progress value 1; zero console errors.
- 2026-11-09: all internal links resolve across 24 built pages; factory tools pass on the restructured sample course (`run_claims` 3/3 across two part files, `style_lint` 0 problems); `pnpm lint`, `pnpm lint:content`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
