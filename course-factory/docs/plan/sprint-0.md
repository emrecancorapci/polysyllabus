# Sprint 0: Scaffold and deterministic tools

**Status:** Done

## Goal

The pipeline repository exists with agent definitions, schemas and the deterministic tools that do not need an LLM, so later sprints can build on tested pieces.

## Backlog

- [x] S0-1 `AGENTS.md` with layout, pipeline, hard rules and style rules.
- [x] S0-2 Ten subagent definitions in `.claude/agents/` and the Director as the `build-course` skill.
- [x] S0-3 `schemas/claims.schema.json` and `schemas/sources.schema.json`.
- [x] S0-4 `tools/run_claims.py`: runs claim snippets and compares them with the lesson.
- [x] S0-5 `tools/style_lint.py`: dashes, semicolons, sentence length, paragraph length, repeated openers.
- [x] S0-6 `tools/svg_normalize.py`: theme friendly SVG output.
- [x] S0-7 `examples/sample-lesson/` as a target and test fixture.

## Acceptance criteria

- The tools pass on the sample lesson and fail on seeded errors.
- No tool needs network access or an LLM.

## Notes

- The Director is a skill, not a subagent, because subagents cannot spawn other subagents. The main session runs the loop.
- Libgen and similar sites are not supported by design. The Librarian uses open and owned sources only.
- Claim snippets run with restricted builtins and imports and a 10 second limit. This is a guard rail, not a security sandbox.
- The sample lesson frontmatter is illustrative. Sprint 1 aligns it with the real frontend schema.

## Verification log

- 2026-11-09: `run_claims.py` passes the sample, fails a seeded wrong cutoff (factor of 2), blocks `import os` and `open()`, times out an infinite loop, rejects complex results, duplicate ids and schema violations.
- 2026-11-09: `style_lint.py` reports 9 of 9 seeded problems with correct line numbers and 0 problems on a clean document containing math, code, lists, tables, decimals, abbreviations and URLs. A false positive on semicolons inside URLs was found and fixed.
- 2026-11-09: `svg_normalize.py` converts black to `currentColor`, removes the white background, adds `viewBox` and `role`, and is idempotent. `--check` exits 1 before and 0 after.
- Not yet verified: the agent prompts have not been run against a real model. Sprint 1 does that.
