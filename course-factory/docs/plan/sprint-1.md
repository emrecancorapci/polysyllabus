# Sprint 1: One lesson, written and inserted

**Status:** Done

## Goal

Given a hand-written outline entry, the Writer produces a lesson that passes the style linter, and the Integrator inserts it into the frontend, builds it and screenshots it.

## Backlog

- [x] S1-1 Align the sample lesson frontmatter with the frontend's `content.config.ts`. Update the Writer prompt with the exact fields. No change needed: the sample already matched and `writer.md` already listed the exact fields (verified during the merge plan).
- [x] S1-2 Make the frontend build run the style linter, or add a `pnpm lint:content` script that calls `tools/style_lint.py`. Decide the location and keep the rule set identical. Added `pnpm lint:content` at the repo root over `src/docs/courses`. The 4 existing lessons were fixed to pass (29 problems, mechanical style edits only).
- [x] S1-3 Hand write one `outline.json` entry (for example "Common-Emitter Amplifier") without sources. `work/analog-electronics/outline.json`, one lesson, no sources.
- [x] S1-4 Run `writer` on it. Record what the model gets wrong in the prompt, and tighten `writer.md`. See the verification log for the four friction points and the prompt fixes.
- [x] S1-5 Run `editor`. Confirm numbers are untouched by running `run_claims.py` before and after. Claims reports were identical, 11 of 11 pass both times.
- [x] S1-6 Run `integrator` with Playwright. Save the screenshot and check the console for errors. Build green, screenshot saved, console clean. The screenshot used the frontend's npm Playwright instead of the Python package.
- [x] S1-7 Write `docs/runbook.md` with the commands to run one lesson by hand.

## Acceptance criteria

- One lesson goes from outline entry to a built page with no manual edits to the MDX. Met. The Director never edited `doc.mdx` (the seeded failure line was added and reverted verbatim for the refusal test).
- `style_lint.py` reports 0 problems and `pnpm build` passes. Met.
- The Integrator refuses to copy a lesson whose gates fail (test with a seeded failure). Met. A seeded semicolon stopped the run at gate 1 and nothing was copied.

## Notes

- Only the Writer, Editor and Integrator are exercised. Evaluators come next.
- Keep the lesson small. The goal is to test the loop, not to produce a good course.

## Verification log

- 2026-11-09 S1-2: `pnpm lint:content` added (root `package.json` + `AGENTS.md` note, commit `0726900`). `style_lint.py` over `src/docs/courses` found 29 problems in the 4 existing lessons, all mechanical (em dashes, semicolons, 2 long sentences, 1 repeat warning). Fixed in commit `3ec7097`. The whole collection now reports 0 problems. `style_lint.py` needs only `python3`.
- 2026-11-09 S1-3: outline written by hand. Course `analog-electronics` (Tech, Electronics, intermediate), lesson `1-common-emitter-amplifier`, 30 minutes, no sources, Mermaid only (no figure files this sprint).
- 2026-11-09 S1-4: Writer run as a fresh subagent with only its definition and run constraints. Output: `doc.mdx` (198 lines), `claims.json` (11 claims), empty `citations.json`, `figures.md` (3 deferred briefs). Gates: 11 of 11 claims pass, 0 style problems. The Director recomputed all 11 numbers by hand and confirmed them. Friction recorded and fixed:
  1. Multiple choice claims: the definition demanded a claim per quiz answer, which forced a useless `result = 2` index claim. Fixed in `writer.md`: NumericQuiz always gets a claim, Quiz only when the correct option is a computed number, never placeholder index claims.
  2. Claim text matching: results must appear as plain text in the doc because `run_claims.py` matches verbatim. Was implicit in the tooling. Fixed in `writer.md` with examples.
  3. The sample lesson had no `citations.json` or `figures.md`. Both added to `examples/` so the example shows the full file set.
  4. No factory venv existed, so `run_claims.py` silently skipped schema validation (jsonschema missing). Documented in `docs/runbook.md`.
- 2026-11-09 S1-5: Editor run as a fresh subagent. Split sentences, plainer wording, antecedent fixes, summary rewording. `claims-report.json` identical before and after (11 of 11, same expected and computed values). `review-edit.md` written.
- 2026-11-09 S1-6: Seeded failure test: a semicolon sentence was appended to `doc.mdx`, the Integrator stopped at gate 1 with a clear report and copied nothing. Clean run: `course.json` created from the outline, `doc.mdx` copied, `pnpm lint`, `pnpm typecheck` and `pnpm build` all green (10 pages, new routes `/courses/analog-electronics/` and the lesson page). Browser check: 0 console errors, KaTeX display math rendered, Mermaid SVG rendered, NumericQuiz wrong answer shows feedback with explanation, Quiz correct option locks the options and shows the explanation. The NumericQuiz correct branch was not clicked directly: in the embedded browser, `client:visible` islands do not hydrate after a reload (reproduced on the existing dc-circuits lesson, so it is an environment quirk, not a lesson defect). The correct branch is the same `submit()` path with the opposite boolean. Screenshot taken with the frontend's npm Playwright CLI, full page, saved to the lesson work folder (gitignored).
- 2026-11-09 S1-7: `docs/runbook.md` written: setup, outline, writer, gates, editor, integrator, browser check with the Playwright CLI fallback, commit conventions.
