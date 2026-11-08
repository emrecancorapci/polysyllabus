# Sprint 6 — Progress Tracking

**Status:** Done

## Goal

Learners can track progress: mark lessons complete, record quiz scores, and see course-level progress — persisted in `localStorage`, with no global state library.

## Backlog

- [x] S6-1 Progress store module over `localStorage` (completed lesson ids, quiz scores per lesson) keyed by ids that stay stable across builds.
- [x] S6-2 "Mark as complete" control in the lesson layout.
- [x] S6-3 Course page and sidebar show completion state and overall progress.
- [x] S6-4 `<Quiz>` records scores through the store.

## Acceptance criteria

- Completing a lesson and reloading keeps it completed.
- Quiz scores persist and are visible per lesson.
- No state library added; all persistence is `localStorage`.
- Behavior is identical in `pnpm dev` and the built site.

## Notes

- Storage: single namespaced+versioned key `study-helper:progress:v1` with runtime shape validation; lesson ids (path-derived entry ids) are the stable keys.
- Architecture: static markup stays the source of truth; `ProgressEnhance.astro` (bundled Astro `<script>`) decorates sidebar/course-page elements from the store. Islands (`CompleteButton`, `Quiz`) write to the store and everything syncs via a `study-helper:progress` window event — no state library, no prop drilling.
- Islands initialize uncompleted/unanswered and sync from the store in `useEffect` to avoid SSR hydration mismatches.
- `Quiz.astro` derives its lesson id from the page URL (`/courses/<course>/<lesson>/` → entry id); quizzes are stored one per lesson.
- The quiz slot on course cards sits inside the time span so the enhancer can overwrite it without clobbering the minutes.

## Verification log

- 2026-11-08: built-site browser test — fresh visit shows incomplete; completing flips the button and adds the sidebar ✓ live; reload persists button/sidebar/quiz feedback ("Correct." restored); course page shows "1 of 2 lessons completed", progress value 1, "quiz ✓" marker; a fresh browser context shows 0 of 2 (localStorage is the only source); zero console errors. Dev server: same hydration behavior, zero console errors. `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
