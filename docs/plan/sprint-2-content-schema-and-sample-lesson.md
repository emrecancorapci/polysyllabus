# Sprint 2 — Content Schema and Sample Lesson

**Status:** Not started

## Goal

Course content is a validated Astro content collection: lesson frontmatter is checked by a Zod schema at build time, and one sample lesson renders at a real route.

## Backlog

- [ ] S2-1 Define the lesson collection in `src/content.config.ts` using the file-system loader with base `./src/docs/courses` and pattern `**/doc.mdx`, so lessons live at `<course-slug>/<n>-<module-slug>/doc.mdx` per `AGENTS.md`.
- [ ] S2-2 Write the Zod schema: `title`, `order`, `summary`, `prerequisites`, `learningObjectives`, `estimatedTime`, `needsReview`.
- [ ] S2-3 Add one sample lesson (`doc.mdx`) with valid frontmatter and one code-generated SVG figure beside it.
- [ ] S2-4 Add a minimal page route that renders the sample lesson body.
- [ ] S2-5 Verify the failure path once: malformed frontmatter must fail `pnpm build` with a Zod error naming the field. Record the result here, then revert.

## Acceptance criteria

- `pnpm build` passes with the sample lesson and its figure.
- Invalid frontmatter (missing field or wrong type) fails the build instead of rendering silently.
- The folder layout matches the structure in `AGENTS.md` exactly.

## Notes

- Keep interactive components out of the sample lesson for now; they are Sprint 5.

## Verification log

- (pending)
