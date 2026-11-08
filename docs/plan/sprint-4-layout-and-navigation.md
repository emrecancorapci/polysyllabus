# Sprint 4 — Layout and Navigation

**Status:** Not started

## Goal

The site reads like a course: a home page listing courses, a course page listing lessons in order, and a lesson layout with sidebar navigation and prev/next links.

## Backlog

- [ ] S4-1 Home page: list courses from the collection.
- [ ] S4-2 Course page: lessons ordered by `order`, showing title, summary, and estimated time.
- [ ] S4-3 Lesson layout: sidebar course outline, prev/next lesson links, breadcrumbs.
- [ ] S4-4 Serve a helpful 404 for unknown course/module/lesson slugs.

## Acceptance criteria

- Every lesson is reachable from the home page in at most 3 clicks.
- Lessons appear in `order` sequence everywhere: course page, sidebar, and prev/next links.
- `pnpm build` emits correct pages for all routes; navigation works in the preview build.
