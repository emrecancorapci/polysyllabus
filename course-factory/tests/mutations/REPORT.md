# Mutation test report

Measures how well the math verification pipeline catches writer errors. Run date: 2026-11-10. Base lesson: `work/analog-electronics/1-common-emitter-amplifier` (the sprint 1 lesson, 10 claims, 2 quizzes, 7 parts).

## How to reproduce

```
python tests/mutations/generate.py       # seed the mutants into tests/mutations/generated/
python tools/run_mutations.py            # deterministic catch table (run_claims.py alone)
# then run the math evaluator on every mutant folder and on the clean base lesson
```

## Results

| Mutant | Seeded error | run_claims alone | Math evaluator | Caught |
| --- | --- | --- | --- | --- |
| m01-factor-2-selfconsistent | $I_C$ halved in text, claim code and expected | pass | FAIL, found the fabricated `2 * RE` | yes (evaluator) |
| m02-sign-swap-selfconsistent | gain $+188$ in text, code and expected | pass | FAIL, contradicts $-g_m R_C$ and part 6 | yes (evaluator) |
| m03-prefix-k-to-m | $R_1$ = 68 MΩ, base voltage 2.1 mV | pass | FAIL, transistor cut off, all downstream numbers unjustified | yes (evaluator) |
| m04-quiz-claims-mismatch | quiz key 5.2 V, claim code computes 4.8 | FAIL | FAIL, blind solve gives 4.8 V | yes (run_claims) |
| m05-mcq-wrong-index | MCQ answer index 2 to 3 | pass | FAIL, option 3 is false physics | yes (evaluator) |
| m06-text-typo-warning-only | text 6.5 V, claims 6.2 V | warn only | FAIL, investigated the warning | yes (evaluator) |
| m07-unit-error | transconductance "40 W" | pass | FAIL, pint rejects S to W | yes (evaluator) |
| m08-tolerance-broken | quiz tolerance rel 0.9 | pass | FAIL, accepts 0.48 to 9.12 V | yes (evaluator) |
| m09-unclaimed-number | output resistance 4.7 kΩ with no claim | pass | FAIL, coverage rule | yes (evaluator) |
| m10-limit-behavior | "positive wiggle gives positive output wiggle" | pass | FAIL, stage inverts, sympy limit check | yes (evaluator) |

**Catch rate: 10 of 10 (100 percent), target was 90 percent.**

Control (false failure check): the clean base lesson was evaluated in the same way and **PASSed** with zero issues. The evaluator used `tools/circuit_check.py` plus its own VCCS nodal analysis to confirm the gains.

Never-edit check: after all evaluations, every mutant folder was diffed against a fresh generation. Only `review-math.md` and the tool written `claims-report.json` were added. No `doc.mdx`, `claims.json` or figure was modified.

## Findings

- Deterministic tools alone catch 1 of 10. The independent evaluator is load bearing, exactly as the design assumes. Self-consistent errors (wrong number, wrong code, wrong expected, all matching) can only be caught by independent recomputation.
- `run_claims.py` reports a claim-text mismatch as a **warning**, not a failure (m06). The gate still passes. The evaluator prompt therefore says to investigate every warning, which worked. If the evaluator step is ever skipped, a text-only edit slips through the deterministic gates.
- The sprint 1 lesson still carried the `quiz-gain-behavior` placeholder index claim (banned by the writer prompt in sprint 1). It was removed from the base lesson before generating mutants. The placeholder claim would have flagged m05 with a false sense of deterministic coverage.
- Two generator bugs were caught by the dry run itself: m03 was accidentally catchable through a rounding mismatch inside the tight `rel: 0.0001` tolerance (expected value must equal the true computed value), and the folder-name warning polluted every mutant until the generator set the claims `lesson` field per mutant.
