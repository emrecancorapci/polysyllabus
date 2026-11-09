# AGENTS.md

Guidance for AI agents (and humans) working on the **frontend** of this project.

## Project Overview

A personal study tool for electrical and electronics engineering courses. A separate generation pipeline produces course material as MDX files; this frontend renders them as structured, Coursera-style courses. It may become a product later, so keep the content format independent of the frontend and keep generation separate from the site. Astro-specific agent notes (for example, dev server background mode) are in `docs/ASTRO.md`.

## Repo Layout

This repository has two parts. The frontend lives at the repo root and follows this file. The course generation pipeline lives in `course-factory/`. It has its own `AGENTS.md`, Python tools and sprint plans in `course-factory/docs/plan/`. Work inside that folder follows its rules.

The planning rule (start with the lowest-numbered sprint whose status is not Done) applies per folder. `docs/plan/` for the frontend, `course-factory/docs/plan/` for the factory. `docs/plan/merge-course-factory.md` is a one-off plan that spans both.

## Tech Stack

- **pnpm** is the package manager; run all installs and scripts through it.
- **Astro** with **content collections** (Zod schemas validate all content at build time)
- **MDX** (`@astrojs/mdx`) for lessons, including interactive components
- **Tailwind CSS** for styling
- **shadcn/ui** (React islands) for UI primitives
- **KaTeX** (`remark-math` + `rehype-katex`) for equations
- **Mermaid** for block diagrams and flowcharts
- **TypeScript** (pinned to the latest 6.x, see Tooling)
- No global state library. Progress tracking (completed lessons, quiz scores) uses `localStorage` via `src/lib/progress.ts`; static navigation is decorated client-side by `src/components/chrome/ProgressEnhance.astro`, islands and the enhancer sync through a custom window event.

## Content Structure

```
/src
  /docs
    /courses
      /<course-slug>
        course.json
        /<n>-<lesson-slug>
          lesson.json
          /<p>-<part-slug>
            doc.mdx
            fig-*.svg / *.png / *.json
```

- The hierarchy is course → lesson → part: lessons are chapters of 20–40 minutes, parts are study pages of at most 10 minutes (enforced by the build). The full taxonomy reads `category → subCategory → course → lesson → part`.
- Each part lives in its own folder with its assets beside it.
- Every course declares its metadata in `course.json`: `title`, optional `summary`, `category`, `subCategory`, and `difficulty` (`beginner`/`intermediate`/`advanced`). Every lesson declares `title`, `order`, and optional `summary` in `lesson.json`. Missing metadata fails the build. See `docs/lesson-authoring.md`.
- Every part has frontmatter validated by the collection's Zod schema: title, order, summary, prerequisites (part ids), learning objectives, estimated time (1–10 minutes), and a needs-review flag.
- Malformed content must fail `astro build`, never render silently broken.
- Lessons may only use the small, documented set of MDX components (callouts, quizzes, collapsible solutions, interactive widgets). Do not add ad-hoc components inside content. The allowed set and its props are documented in `docs/content-components.md`; it is enforced by the components map passed to `<Content />` in the lesson route. Do not import `.astro` components from `.ts` modules — typescript-eslint cannot resolve them; wire them inside `.astro` files.
- **Display math must use the fenced form**: `$$` on its own line, then the equation, then `$$`. A single-line `$$…$$` parses as _inline_ math (remark-math v6 grammar) and renders cramped fractions in a text line.
- Prefer code-generated figures (SVG, CircuiTikZ to SVG, Schemdraw, matplotlib) over raster images of circuits.
- The full authoring guide for producing lessons (structure, frontmatter, math rules, failure modes, verification) is `docs/lesson-authoring.md`; component props are in `docs/content-components.md`.

## Workflow Rules

### Commits

- Use **atomic commits**: one logical change per commit.
- A commit should not exceed **~400 changed lines**. Treat this as a guideline: if it would force impractically small commits, adjust the split and note the exception in the sprint file.
- Exceptions to the size limit: project scaffolding, package installation, and data insertion (adding content to the collections).
- Use **Conventional Commits** (`feat`, `fix`, `docs`, `build`, `chore`, ...), optionally with a scope. Subjects are short, imperative, lowercase, and don't end in a period (for example `feat(content): add lesson frontmatter schema`).
- Lockfile changes belong in the commit that changes the dependencies.

### Dependencies

- Use the **latest versions** of packages.
- **Exception: TypeScript.** Stay on the latest 6.x. TypeScript 7.x does not yet support linters. Revisit when typescript-eslint supports it.
- When adding a package, install it through the package manager (do not hand-edit versions), and commit it separately from feature code.
- **pnpm 12** no longer reads the `pnpm` field in `package.json`; overrides live in `pnpm-workspace.yaml`. That file pins `@emnapi/runtime` to 1.11.3 — without the override, `pnpm typecheck` (`astro check`) crashes because pnpm auto-installs an incompatible `2.0.0-beta` peer.
- Mermaid diagrams render **at build time** (`rehype-mermaid` + Playwright). After a fresh clone, run `pnpm exec playwright install chromium` once, or `astro build` fails.

### Planning (Scrum-like)

- Plan work in **sprints/phases**. The plan lives in `docs/plan/`: one file per sprint with a goal, a backlog of user stories, acceptance criteria, and a status. `docs/plan/README.md` is the sprint index; start with the lowest-numbered sprint whose status is not **Done**.
- **Every phase must leave the app runnable** (`pnpm dev` and `pnpm build` succeed). The first 2-3 phases (scaffolding, tooling, schema) may be the only exceptions, and only if necessary.
- Each sprint ends with a demonstrable increment: something you can open in the browser and use.
- Update the plan as work completes. Move unfinished stories to the next sprint instead of leaving them half-done.
- Suggested early order: scaffold and tooling, content schema and one sample lesson, math rendering, layout and navigation, MDX interactive components, progress tracking.

### Linting and Formatting

- **ESLint** with **typescript-eslint** using the **type-aware** configuration (`recommendedTypeChecked` or stricter, with `parserOptions.projectService`) for TypeScript/JavaScript sources, plus `eslint-plugin-astro` for `.astro` sources. Type-aware rules cannot run inside `.astro` frontmatter (`astro-eslint-parser` does not support `projectService`); `astro check` covers those types instead.
- **Biome** for formatting and additional linting. Biome is the only formatter.
- Avoid overlapping rules: disable ESLint rules that Biome already covers (or the reverse), so the two tools do not conflict.
- Run before every commit:
  - `pnpm lint` (ESLint and Biome)
  - `pnpm format` (Biome)
  - `pnpm typecheck` (`astro check`)
  - `pnpm build` (validates content against the Zod schemas)

For content changes also run `pnpm lint:content`. It calls the factory's style linter over `src/docs/courses` with the same rule set the Writer agents follow. It needs only `python3` on PATH.

- Do not suppress lint errors without a short comment explaining why.

## Definition of Done

- Lint, typecheck, and build all pass.
- The change is in an atomic commit with a clear message.
- The sprint plan is updated.
- For content changes: the lesson passes the schema, math and figures render, and any numeric results have been verified.
