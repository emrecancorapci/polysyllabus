PASS

# Math review: 1-common-emitter-amplifier

Reviewed all 7 parts (`doc.mdx`), lesson level `claims.json`, and the two quizzes.
ngspice is not installed, so circuit checks used `tools/circuit_check.py` with a
JSON netlist plus an independent numpy nodal analysis. There are no data
`*.json` files and no `.cir` netlists in this lesson.

## Tool run

`python tools/run_claims.py work/analog-electronics/1-common-emitter-amplifier`
returns **10/10 PASS, 0 failures, 0 warnings**. Every claim text was found in
the parts, so no number was edited without updating `claims.json`.

## Coverage

Every computed number in the parts has a claim:

| Number in text | Location | Claim id |
| --- | --- | --- |
| 1.8 V | 4-bias-point step 1 | bias-base-voltage |
| 1.1 V | 4-bias-point step 2 | bias-emitter-voltage |
| 1.0 mA | 4-bias-point step 3, restated in part 5 | bias-collector-current |
| 6.2 V | 4-bias-point step 4 | bias-vce |
| 40 mS | 5-small-signal-gain, restated in part 6 | small-signal-gm |
| -188 | 5-small-signal-gain, restated in part 6 quiz explanation | gain-bypassed |
| 45 | 6-unbypassed-gain (feedback factor and gain ratio) | gain-feedback-factor |
| -4.18 | 6-unbypassed-gain, twice | gain-unbypassed |
| 25 ohm | 6-unbypassed-gain | intrinsic-emitter-resistance |
| 4.8 V | 4-bias-point NumericQuiz answer | quiz-bias-vce |

All given values (12 V, 68/12/4.7/1.1 kOhm, 0.7 V, 25 mV, and the quiz's
10 V, 30/10/6.8/3.6 kOhm) appear as claim quantities. Remaining numerals are not
computations: component counts ("four resistors and three capacitors", matching
the described circuit), "three terminals", "180 degrees" (the definition of
inversion), and frontmatter metadata. No missing claims.

## Blind quiz check

NumericQuiz (4-bias-point), solved from the question text only with Python:

```python
VB  = 10.0 * 10e3 / (30e3 + 10e3)   # 2.5 V
VE  = VB - 0.7                      # 1.8 V
IC  = VE / 3.6e3                    # 0.5 mA
VCE = 10.0 - IC * 6.8e3 - IC * 3.6e3  # 4.8 V
```

Recomputed 4.8 V, answer key 4.8 V. Exact match.

Quiz (6-unbypassed-gain), conceptual. Removing C_E changes the gain by the
factor 1 + g_m R_E (from -188 to -4.18), so the magnitude drops because R_E
pushes back against the input. `answer={2}` is 0-based (confirmed in
`src/components/content/react/Quiz.tsx`: `index === answer`) and points to
exactly that option. Correct.

## Quiz tolerance

`tolerance={{ rel: 0.02 }}` on the NumericQuiz. Per
`src/lib/numeric-quiz.ts`, accepted when |input - 4.8| <= 0 + 0.02 * 4.8 =
0.096. The true value is exact, so it is accepted, and 2% is about one unit in
the last digit of the quoted 4.8. Appropriate.

## Derivations (sympy)

Derived the unbypassed gain from the small-signal relations
(v_be = v_in - v_e, i_c = g_m v_be, v_e = i_e R_E with i_e = i_c, v_out =
-i_c R_C). sympy simplifies to `-R_C*g_m/(R_E*g_m + 1)`, which matches the
lesson formula. Checks:

- `-R_C/(r_e + R_E)` with `r_e = 1/g_m` is symbolically identical. Confirmed.
- Limit R_E -> 0 gives -g_m R_C (bypassed case). Confirmed.
- Limit R_E -> infinity gives 0, asymptotically -R_C/R_E. Confirmed.
- The I_C = I_E assumption shifts the unbypassed gain by 0.0009 (0.02%) at
  beta = 100, far below the quoted digits.
- Sign check: positive base wiggle -> more collector current -> collector
  pulled down, so the minus sign and the "180 degrees" statement are right.

## Units (pint)

All operations dimensionally sound: divider V x Ohm/Ohm -> 1.8 V; 1.1 V / 1.1
kOhm -> 1.0 mA; 12 V - 1 mA x (4.7 + 1.1) kOhm -> 6.2 V; 1 mA / 25 mV ->
40 mS (siemens); g_m R_C and g_m R_E are dimensionless (188 and 44);
1/g_m -> 25 Ohm. Prefixes k, m used consistently with the stated values.

## Circuit check (tools/circuit_check.py, DC netlist)

Netlist: VCC 12 V, divider 68k/12k, R_C 4.7k, R_E 1.1k, BJT modeled as a 0.7 V
base-emitter source plus a 1 mA collector-emitter current source (base current
zero, matching assumption 1). Solver output:

```
vb    1.8 V      ve    1.1 V      vc    7.3 V      vcc  12 V
I(vb,ve) ~ 1.8e-20 A   ->   VCE = 7.3 - 1.1 = 6.2 V
```

Matches the text (V_B 1.8, V_E 1.1, V_CE 6.2, active region, 6.2/12 = 0.52
"near half the supply"). An independent numpy nodal analysis with a VCCS
(g_m = 40 mS) gives the bypassed gain -188.0 and the unbypassed gain
-4.177778, matching both gain claims and the "factor of 45" statement
(188 / 4.17778 = 45.0).

## Issues

None. Every number, equation, derivation step, unit and quiz answer in the
lesson checked out against independent computation.

| Location | Problem | Evidence | Correct value |
| --- | --- | --- | --- |
| (none) | | | |
