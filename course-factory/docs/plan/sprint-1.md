# Sprint 1: One lesson, written and inserted

**Status:** Todo

## Goal

Given a hand-written outline entry, the Writer produces a lesson that passes the style linter, and the Integrator inserts it into the frontend, builds it and screenshots it.

## Backlog

- [ ] S1-1 Align the sample lesson frontmatter with the frontend's `content.config.ts`. Update the Writer prompt with the exact fields.
- [ ] S1-2 Make the frontend build run the style linter, or add a `pnpm lint:content` script that calls `tools/style_lint.py`. Decide the location and keep the rule set identical.
- [ ] S1-3 Hand write one `outline.json` entry (for example "Common-Emitter Amplifier") without sources.
- [ ] S1-4 Run `writer` on it. Record what the model gets wrong in the prompt, and tighten `writer.md`.
- [ ] S1-5 Run `editor`. Confirm numbers are untouched by running `run_claims.py` before and after.
- [ ] S1-6 Run `integrator` with Playwright. Save the screenshot and check the console for errors.
- [ ] S1-7 Write `docs/runbook.md` with the commands to run one lesson by hand.

## Acceptance criteria

- One lesson goes from outline entry to a built page with no manual edits to the MDX.
- `style_lint.py` reports 0 problems and `pnpm build` passes.
- The Integrator refuses to copy a lesson whose gates fail (test with a seeded failure).

## Notes

- Only the Writer, Editor and Integrator are exercised. Evaluators come next.
- Keep the lesson small. The goal is to test the loop, not to produce a good course.

## Verification log

(empty)
