# Sprint 2 — Content Schema and Sample Lesson

**Status:** Done

## Goal

Course content is a validated Astro content collection: lesson frontmatter is checked by a Zod schema at build time, and one sample lesson renders at a real route.

## Backlog

- [x] S2-1 Define the lesson collection in `src/content.config.ts` using the file-system loader with base `./src/docs/courses` and pattern `**/doc.mdx`, so lessons live at `<course-slug>/<n>-<module-slug>/doc.mdx` per `AGENTS.md`.
- [x] S2-2 Write the Zod schema: `title`, `order`, `summary`, `prerequisites`, `learningObjectives`, `estimatedTime`, `needsReview`.
- [x] S2-3 Add one sample lesson (`doc.mdx`) with valid frontmatter and one code-generated SVG figure beside it.
- [x] S2-4 Add a minimal page route that renders the sample lesson body.
- [x] S2-5 Verify the failure path once: malformed frontmatter must fail `pnpm build` with a Zod error naming the field. Record the result here, then revert.

## Acceptance criteria

- `pnpm build` passes with the sample lesson and its figure.
- Invalid frontmatter (missing field or wrong type) fails the build instead of rendering silently.
- The folder layout matches the structure in `AGENTS.md` exactly.

## Notes

- Keep interactive components out of the sample lesson for now; they are Sprint 5.
- The `glob` loader's default ID keeps the file name (`.../1-ohms-law/doc`); a custom `generateId` strips the trailing `/doc` so ids are `<course>/<n>-<module-slug>`.
- Relative figure references (`./fig-*.svg`) already resolve through the loader into the image pipeline — Sprint 3's S3-3 is mostly proven.
- `estimatedTime` is minutes (integer). Formulas in the sample lesson use inline code until Sprint 3 wires KaTeX.

## Verification log

- 2026-11-08: `pnpm build` passes with 2 pages; lesson figure served from `/_astro/fig-ohms-law-circuit.*.svg`; dev server serves `/courses/dc-circuits/1-ohms-law/`.
- 2026-11-08: failure path verified — setting `estimatedTime: "twenty minutes"` fails the build with `[InvalidContentEntryDataError] lessons → dc-circuits/1-ohms-law ... estimatedTime: Expected type "number", received "string"`. Reverted after.
- 2026-11-08: `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
