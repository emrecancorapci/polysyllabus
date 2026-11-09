# Merge plan: course-factory into the repo

**Status:** Done

## Goal

`course-factory/` becomes a first class part of this repository. The frontend stays at the repo root. The factory reads the frontend contract docs directly instead of a snapshot copy. Frontend and factory plans coexist with clear governance.

This file is the handoff document. An agent with no other context can execute it top to bottom.

## Verified state (checked 2026-11-09)

All of this was checked before writing the plan. Re-check only what the work touches.

- `git status --short` shows `?? course-factory/`. The folder is untracked and has no nested `.git`.
- The project is named `polysyllabus`. Frontend sprints 1 to 7 are Done, sprint 8 is in progress (`docs/plan/README.md`).
- Factory sprint 0 is Done and its tools are verified (`course-factory/docs/plan/sprint-0.md`). Sprints 1 to 5 are Todo. The agent prompts have never run against a real model.
- The three tools (`tools/run_claims.py`, `tools/style_lint.py`, `tools/svg_normalize.py`) are layout independent. They resolve schema paths relative to `__file__` and take lesson folders as arguments.
- `diff course-factory/docs/frontend-snapshot/lesson-authoring.md docs/lesson-authoring.md` is empty. The same holds for `content-components.md`. The snapshot is current at merge time.
- The sample lesson frontmatter keys match `src/content.config.ts` exactly (title, order, summary, prerequisites, learningObjectives, estimatedTime, needsReview). This also satisfies factory sprint 1 story S1-1.
- `.claude/` holds all ten agent definitions plus `skills/build-course/SKILL.md`.
- `work/` was empty at check time. The person later added `course-factory/.gitignore`, see M2-4 and M2-5.
- `FRONTEND_DIR` appears only in prose (`AGENTS.md`, `SKILL.md`, `outliner.md`, `integrator.md`). No tool code reads it.
- Root `pnpm lint` and `pnpm format` (Biome) scan every file that is not gitignored, so they reach into `course-factory/`. The sample SVG fails `noSvgWithoutTitle` and the markdown and JSON formatters would rewrite factory files. The factory has its own tooling, so the frontend tools must exclude it (M2-7).
- Frontend content SVGs pass the Biome SVG rule because they carry `role="img"`, `aria-labelledby` and a `<title id="fig-title">` element (see `src/docs/courses/dc-circuits/1-ohms-law/fig-ohms-law-circuit.svg`). The factory sample SVG has `role="img"` but no title.

## Decisions (made with the person, do not revisit)

1. `work/` is committed, except downloaded payloads and regenerable extraction output (M2-4).
2. The factory points at the frontend contract docs under `FRONTEND_DIR` (default `..`). The snapshot copies are deleted after the verbatim import.
3. The `pnpm lint:content` bridge is factory sprint 1 work (S1-2), not part of this merge.
4. The `FRONTEND_DIR` default changes from `../frontend` to `..`.

## Commit 1: verbatim import

Message: `feat(course-factory): import course generation pipeline`

- [x] M1-1 Run `git add course-factory/` and commit everything as it stands. No edits. The scaffolding exception to the ~400 line rule applies (see the root `AGENTS.md`). Committed as `43ed879`.
- Do this before creating any Python venv, so no `.venv` lands in the commit.

## Commit 2: wire into the repo layout

Message: `chore(course-factory): wire pipeline into repo layout`

About 50 changed lines. The edit specs give the exact text. Wording may be adjusted as long as the meaning stays. Committed as `7d1e3fc` (8 files, 16 insertions, 309 deletions).

### M2-1 `course-factory/AGENTS.md` (line 39) — done

Find:

> The frontend location is read from `FRONTEND_DIR` (default `../frontend`). Its `docs/lesson-authoring.md` (structure, frontmatter, math and figure rules, failure modes) and `docs/content-components.md` (allowed MDX components and props) are the contract for lessons.

Replace with:

> The frontend is the repository root, one level up. Its location is read from `FRONTEND_DIR` (default `..`). The contract for lessons is `docs/lesson-authoring.md` (structure, frontmatter, math and figure rules, failure modes) and `docs/content-components.md` (allowed MDX components and props), both under `FRONTEND_DIR`.

Keep the rest of the paragraph ("Read both before writing a lesson. ... Point to them.") unchanged.

### M2-2 `.claude/skills/build-course/SKILL.md` (line 29) — done

Find `Do not commit in the frontend repo.` and replace with `Do not commit.` The rest of the sentence, which suggests the commit message `feat(content): add <lesson title> lesson`, stays.

No change is needed in `SKILL.md` line 36, `outliner.md` or `integrator.md`. They use `$FRONTEND_DIR` paths that resolve correctly with the new default.

### M2-3 Delete the snapshot — done (diff was empty, safe to remove)

Run `rm -r course-factory/docs/frontend-snapshot/`.

If the diff against `docs/lesson-authoring.md` or `docs/content-components.md` is not empty on the day of the merge, stop and reconcile the differences first. Do not delete silently.

### M2-4 and M2-5 factory gitignore (superseded by the person's file)

The person had already added `course-factory/.gitignore` before execution, so no `work/.gitignore` was needed. The person's file covers `.venv/`, `__pycache__/`, `*.pyc`, `work/*/sources/*` (keeping `sources.json`), `work/*/extracted/` and `work/*/*/screenshot.png`. It was committed verbatim in commit 1.

One extension was applied in commit 2: `work/*/*/claims-report.json` became a bare `claims-report.json`, so the report generated in `examples/` during verification is ignored too.

- [x] M2-4 work payloads ignored (via the person's `course-factory/.gitignore`)
- [x] M2-5 venv, pycache and claims reports ignored (same file)

### M2-6 Root `AGENTS.md`, new section — done

Insert after the Project Overview section, before Tech Stack:

> ## Repo Layout
>
> This repository has two parts. The frontend lives at the repo root and follows this file. The course generation pipeline lives in `course-factory/`. It has its own `AGENTS.md`, Python tools and sprint plans in `course-factory/docs/plan/`. Work inside that folder follows its rules.
>
> The planning rule (start with the lowest-numbered sprint whose status is not Done) applies per folder. `docs/plan/` for the frontend, `course-factory/docs/plan/` for the factory. `docs/plan/merge-course-factory.md` is a one-off plan that spans both.

### M2-7 Exclude the factory from frontend lint and format — done

Biome scans everything not gitignored, so it reaches into `course-factory/` (lint error on the sample SVG, and the markdown and JSON formatters would rewrite factory files). ESLint matches no factory file today, but the ignore documents intent.

`biome.jsonc`, extend the `files` block:

```jsonc
  "files": {
    "ignoreUnknown": false,
    "includes": ["**", "!course-factory"]
  },
```

`eslint.config.ts`, extend the global ignores object:

```ts
  { ignores: ["dist/", ".astro/", "course-factory/"] },
```

## Verification

- [x] M3-1 The three tools pass on the sample course. `run_claims.py` needs `numpy` and `jsonschema` installed. A full venv from `requirements.txt` is not needed for this check, it is needed for later sprints.

  ```
  cd course-factory
  python tools/run_claims.py examples/sample-course/1-rc-low-pass-filter
  python tools/style_lint.py examples/sample-course/1-rc-low-pass-filter
  python tools/svg_normalize.py examples/sample-course/1-rc-low-pass-filter --check
  ```

  All three exit 0. `run_claims.py` writes `claims-report.json` next to the sample lesson, which M2-5 ignores.

- [x] M3-2 `grep -rn "\.\./frontend" course-factory/` returns nothing.
- [x] M3-3 At the repo root: `pnpm lint`, `pnpm typecheck` and `pnpm build` all pass.

## Acceptance criteria

- Two atomic commits in the order above.
- No `../frontend` path remains anywhere under `course-factory/`.
- The contract doc references in factory prose resolve to real files in this repo.
- The frontend build is unaffected.
- This plan's Status is set to Done and the verification log is filled in.

## Handoff notes

- The Definition of Done in the root `AGENTS.md` applies to both commits.
- After this merge the next factory work is sprint 1 (`course-factory/docs/plan/sprint-1.md`). Story S1-1 is already satisfied, see Verified state. Sprint 1 covers the `pnpm lint:content` bridge, one lesson through the writer, editor and integrator loop, and the runbook.
- Factory sprint 0 is Done. Do not redo its work.
- The system packages (tesseract, ngspice) and the full Python venv are needed from sprint 1 onward, not for this merge.
- Frontend sprint 8 (backlog, in progress) is unaffected by this merge.
- When the Integrator later lands lessons in `src/docs/courses/`, their SVGs must satisfy Biome's `noSvgWithoutTitle` rule (`role="img"`, `aria-labelledby`, `<title>`). `svg_normalize.py` does not add these yet. That is factory sprint 4 work (S4-4), tracked here so it is not forgotten.

## Verification log

- 2026-11-09: Commit 1 `43ed879` `feat(course-factory): import course generation pipeline`. 32 files, 1950 insertions, verbatim, including the person's `course-factory/.gitignore`.
- 2026-11-09: Commit 2 `7d1e3fc` `chore(course-factory): wire pipeline into repo layout`. 8 files, 16 insertions, 309 deletions (mostly the snapshot removal).
- 2026-11-09: M3-1 pass. `run_claims.py` 3 of 3 claims, 0 warnings. `style_lint.py` 0 problems. `svg_normalize.py --check` ok. Run with a temporary venv (`numpy` + `jsonschema`) at `/tmp/opencode/cf-venv`, outside the repo.
- 2026-11-09: M3-2 pass. `grep -rn "\.\./frontend" course-factory/` has no matches.
- 2026-11-09: M3-3 pass. `pnpm lint`, `pnpm format`, `pnpm typecheck` and `pnpm build` all green. Build produced 8 pages. `astro check` reports 18 pre-existing z-deprecation hints, 0 errors, unrelated to this merge.
- 2026-11-09: Discovered during execution: frontend lint and format reached into `course-factory/`, so M2-7 was added. The first pattern `!course-factory/**` triggered Biome's `useBiomeIgnoreFolder` warning. Final pattern is `!course-factory`.
- Known intermediate state: at commit 1 exactly, `pnpm lint` fails because the Biome exclusion only lands with commit 2. `pnpm dev` and `pnpm build` stay green throughout.
