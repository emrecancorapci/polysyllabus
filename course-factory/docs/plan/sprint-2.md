# Sprint 2: Executable claims and math evaluation

**Status:** Todo

## Goal

Wrong math is caught before it reaches a lesson. The Writer emits `claims.json`, the Math evaluator verifies the lesson independently, and the Director runs a bounded revision loop.

## Backlog

- [ ] S2-1 Teach the Writer to emit complete `claims.json` files. Measure coverage: every number in `doc.mdx` should have a claim.
- [ ] S2-2 Run the Math evaluator with a different model than the Writer. Compare results on the same lesson.
- [ ] S2-3 Blind quiz recomputation: the evaluator solves quiz questions from the question text only.
- [ ] S2-4 Add sympy derivation checks and `pint` unit checks to the evaluator workflow. Write small helper scripts in `tools/` if the agent keeps rewriting the same code.
- [ ] S2-5 Add circuit checks with ngspice (PySpice) or a small nodal analysis helper. Cover an RC filter and a common-emitter bias point.
- [ ] S2-6 Implement the revision loop in the Director skill: writer, claims, evaluator, back to writer, maximum 3 rounds, then `needs_review`.
- [ ] S2-7 Build a mutation test set (see Notes) and record the catch rate.

## Acceptance criteria

- The seeded mutations are caught at a rate of at least 90 percent. Misses are analyzed and the prompts or tools are fixed.
- A correct lesson passes without false failures.
- A lesson that cannot be fixed in 3 rounds is flagged and the pipeline continues.

## Notes

- Mutation test set: take a correct lesson and change one thing per copy. Examples: drop a factor of 2 or pi, swap a sign, change a prefix (k to M), wrong quiz answer key, wrong limit behavior, wrong unit.
- The evaluator must never edit the lesson. Check this by diffing the lesson folder before and after.
- Executable claims catch numeric errors. They do not catch a wrong explanation, so the Fact evaluator in Sprint 5 still matters.

## Verification log

(empty)
