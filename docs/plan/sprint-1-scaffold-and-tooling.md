# Sprint 1 — Scaffold and Tooling

**Status:** Not started

## Goal

A runnable, fully tooled Astro project: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, and `pnpm typecheck` all pass on a clean checkout, with Tailwind, React (for shadcn islands), MDX, type-aware ESLint, and Biome configured.

## Backlog

- [ ] S1-1 Initialize the git repo (default branch `main`) with a `.gitignore` for Node/Astro (`node_modules`, `dist`, `.astro`).
- [ ] S1-2 Scaffold the Astro project with pnpm and strict TypeScript; verify `pnpm dev` and `pnpm build` on the default template.
- [ ] S1-3 Pin TypeScript to the latest 6.x (not 7.x).
- [ ] S1-4 Add Tailwind CSS and verify a utility class compiles.
- [ ] S1-5 Add `@astrojs/react` and `@astrojs/mdx` integrations (React is required for shadcn/ui islands).
- [ ] S1-6 Configure ESLint (flat config) with typescript-eslint `recommendedTypeChecked` or stricter, `parserOptions.projectService`, and Astro source support.
- [ ] S1-7 Configure Biome as the only formatter; disable overlapping rules in ESLint or Biome so the two never conflict.
- [ ] S1-8 Add `@astrojs/check` and wire scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck` (`astro check`).
- [ ] S1-9 Initialize shadcn/ui and add `Button` as a proof-of-life island on the demo page.

## Acceptance criteria

- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm format`, and `pnpm typecheck` all pass.
- `tsc` reports a 6.x version.
- Biome owns formatting, ESLint owns type-aware linting, with no duplicated or conflicting rules.
- The demo page renders a shadcn Button React island.
- Scaffolding and package-install commits may exceed the ~400-line limit; otherwise commits are atomic per concern.

## Notes

- This is the only sprint allowed to leave the repo briefly non-runnable mid-flight (before the scaffold commit); it must end runnable.
