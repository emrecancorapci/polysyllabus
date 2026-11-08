# Sprint 8 — Backlog

**Status:** Not started

## Goal

Carry deferred stories from Sprint 7 and the next round of improvements. Nothing here is started; pick up items in order.

## Backlog

- [ ] S8-1 **Multi-select quizzes.** Extend `<Quiz>` with `multiple: true` (checkbox options, several correct indexes, all-or-nothing or partial scoring — decide and document). Deferred from Sprint 7's S7-7.
- [ ] S8-2 **Course metadata.** A course-level metadata format (title, description, badges) instead of slug humanization; update `AGENTS.md` content structure when added. Noted in Sprint 4.
- [ ] S8-3 **Content pipeline hardening.** The generation pipeline will produce lessons in bulk: add a CI workflow running lint/typecheck/build on push, since content errors only surface at build.
