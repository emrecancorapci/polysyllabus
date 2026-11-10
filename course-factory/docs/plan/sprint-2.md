# Sprint 2: Executable claims and math evaluation

**Status:** Done

## Goal

Wrong math is caught before it reaches a lesson. The Writer emits `claims.json`, the Math evaluator verifies the lesson independently, and the Director runs a bounded revision loop.

## Backlog

- [x] S2-1 Teach the Writer to emit complete `claims.json` files. Measure coverage: every number in the lesson's part files should have a claim. Coverage checking is the evaluator's step 2 (strengthened to part wording and warnings). The m09 mutant proves an unclaimed number is a FAIL. The base lesson dropped the banned placeholder index claim.
- [x] S2-2 Run the Math evaluator with a different model than the Writer. Compare results on the same lesson. The Director rule (SKILL.md) says to use a different model when possible. This environment has a single provider, so the runs used fresh-context subagents of the same model. Independence came from never seeing the writer's session. Model differentiation stays configured for real runs.
- [x] S2-3 Blind quiz recomputation: the evaluator solves quiz questions from the question text only. Validated by m04 (numeric) and m05 (multiple choice).
- [x] S2-4 Add sympy derivation checks and `pint` unit checks to the evaluator workflow. Both steps were already in the prompt. Validated by m02, m07 (pint rejects S to W) and m10 (limit check). No helper scripts were needed, the agents did not rewrite the same code.
- [x] S2-5 Add circuit checks with ngspice (PySpice) or a small nodal analysis helper. Cover an RC filter and a common-emitter bias point. ngspice is not installed here, so `tools/circuit_check.py` is a pure Python MNA solver (R, C, V, I elements, DC and one AC frequency, transfer in dB and phase). Selftest covers both required cases: RC at fc gives -3.0103 dB and -45 deg, the CE bias netlist gives Vb 1.8, Ve 1.1, Vc 7.3, Vce 6.2. The control evaluator run also used it and a VCCS analysis to confirm the gains.
- [x] S2-6 Implement the revision loop in the Director skill: writer, claims, evaluator, back to writer, maximum 3 rounds, then `needs_review`. SKILL.md step 4 now keeps a `rounds` counter in `state.json`, and on passing 3 marks the lesson `needs_review` and sets `needsReview: true` in every part's frontmatter before continuing.
- [x] S2-7 Build a mutation test set and record the catch rate. `tests/mutations/generate.py` seeds 10 mutants from the sprint 1 lesson, `tools/run_mutations.py` is the deterministic table, `tests/mutations/REPORT.md` records the full result.

## Acceptance criteria

- The seeded mutations are caught at a rate of at least 90 percent. Met: 10 of 10 (see REPORT.md).
- A correct lesson passes without false failures. Met: the clean base lesson evaluated PASS with zero issues.
- A lesson that cannot be fixed in 3 rounds is flagged and the pipeline continues. Met by the SKILL.md loop (step 4.5). Not exercised on a live run yet, the Director skill has not run a full course.

## Notes

- The lesson and part structure applies (frontend sprint 9): `claims.json` and the review files live at the lesson level, and claim texts are matched across all `doc.mdx` files of the lesson's parts.
- Mutation test set: take a correct lesson and change one thing per copy. Examples: drop a factor of 2 or pi, swap a sign, change a prefix (k to M), wrong quiz answer key, wrong limit behavior, wrong unit.
- The evaluator must never edit the lesson. Check this by diffing the lesson folder before and after. Verified for all 10 mutants, see REPORT.md.
- Executable claims catch numeric errors. They do not catch a wrong explanation, so the Fact evaluator in Sprint 5 still matters.

## Verification log

- 2026-11-09 S2-5: `circuit_check.py --selftest` passes 6 of 6 checks (RC gain and phase at fc, CE Vb, Ve, Vc, Vce).
- 2026-11-10 S2-7: generated 10 mutants. The generator dry run caught two of its own bugs: an m03 expected value that failed the tight `rel: 0.0001` tolerance (rounding, not the seeded error), and folder-name warnings that polluted every row until the claims `lesson` field was set per mutant.
- 2026-11-10 S2-7 deterministic table: `run_claims.py` alone catches 1 of 10 (m04). m06 produces only a text-not-found warning, so it passes the gate. The other 8 are self-consistent by construction.
- 2026-11-10 S2-2/S2-3 evaluator runs: one single-lesson run on m01 (the canonical pipeline path) and one batch run over m02 to m10, each writing `review-math.md` with FAIL and the evidence. All 10 caught. The m01 review found the fabricated `2 * RE` inside the claim code. m07 used pint, m10 used a sympy limit check, m05 and m04 solved the quizzes blind.
- 2026-11-10 control run: the clean base lesson PASSes with zero issues, including a `circuit_check.py` netlist and an independent VCCS nodal analysis of both gains.
- 2026-11-10 never-edit check: every mutant folder diffed against a fresh generation. Only `review-math.md` and the tool written `claims-report.json` differ. No lesson file was modified.
- 2026-11-10 housekeeping: the base lesson's `claims.json` dropped the `quiz-gain-behavior` placeholder index claim (banned by the writer prompt in sprint 1). 10 claims remain, all pass.
