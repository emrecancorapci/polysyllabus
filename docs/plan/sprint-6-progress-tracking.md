# Sprint 6 — Progress Tracking

**Status:** Not started

## Goal

Learners can track progress: mark lessons complete, record quiz scores, and see course-level progress — persisted in `localStorage`, with no global state library.

## Backlog

- [ ] S6-1 Progress store module over `localStorage` (completed lesson ids, quiz scores per lesson) keyed by ids that stay stable across builds.
- [ ] S6-2 "Mark as complete" control in the lesson layout.
- [ ] S6-3 Course page and sidebar show completion state and overall progress.
- [ ] S6-4 `<Quiz>` records scores through the store.

## Acceptance criteria

- Completing a lesson and reloading the page keeps it completed.
- Quiz scores persist and are visible per lesson.
- No state library added; all persistence is `localStorage`.
- Behavior is identical in `pnpm dev` and the built site.
