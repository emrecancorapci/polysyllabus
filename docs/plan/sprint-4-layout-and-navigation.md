# Sprint 4 — Layout and Navigation

**Status:** Done

## Goal

The site reads like a course: a home page listing courses, a course page listing lessons in order, and a lesson layout with sidebar navigation and prev/next links.

## Backlog

- [x] S4-1 Home page: list courses from the collection.
- [x] S4-2 Course page: lessons ordered by `order`, showing title, summary, and estimated time.
- [x] S4-3 Lesson layout: sidebar course outline, prev/next lesson links, breadcrumbs.
- [x] S4-4 Serve a helpful 404 for unknown course/module/lesson slugs.

## Acceptance criteria

- Every lesson is reachable from the home page in at most 3 clicks.
- Lessons appear in `order` sequence everywhere: course page, sidebar, and prev/next links.
- `pnpm build` emits correct pages for all routes; navigation works in the preview build.

## Notes

- Courses are derived from the lessons collection (first path segment), not a separate collection — no course metadata files exist yet. When course-level descriptions are needed, add a course metadata format and update `AGENTS.md`.
- Course titles humanize the slug ("dc-circuits" → "DC Circuits", DC/AC uppercased).
- Prerequisites store lesson ids and are resolved to titles at render time; unknown ids render as-is.
- A second lesson (`2-kirchhoffs-laws`) was added so ordering, sidebar state, and prev/next are demonstrable.
- 404 is a static page (`src/pages/404.astro`); unknown slugs simply never get pages generated, hosts serve /404.html.
- Sidebar is hidden below `lg`; mobile navigation relies on breadcrumbs and prev/next.

## Verification log

- 2026-11-08: 5 pages emitted (home, course, 2 lessons, 404); every internal link in the built site resolves (link-check script over dist HTML); lesson 1 shows Next → lesson 2 and `aria-current="page"` on itself; lesson 2 shows Previous → lesson 1 and no Next (last lesson); course page and sidebar list lessons in `order` sequence. `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
