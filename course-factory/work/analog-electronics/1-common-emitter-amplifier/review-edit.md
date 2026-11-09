# Editor review

`style_lint.py`: 0 problems before the pass, 0 problems after.

## What I changed

Sentence splitting and paragraphing:
- Split the biasing paragraph. Bias point and Q point stay in one paragraph, the active region moved to its own.
- Split the bypass capacitor sentence into two: signal ground behavior and unchanged DC bias.
- Split the diagram summary into three short sentences (one idea each).
- Split "easy to remember" out of the $A_v = -R_C/(r_e + R_E)$ sentence into its own sentence.
- Split the closing stability paragraph: resistor dependence, $g_m$ dependence, and the designer trick are now separate sentences.

Plainer words, filler cut:
- "commands a much larger current" to "controls a much larger current".
- "The game changes:" to "The circuit now behaves differently."
- "This pushback" to "This opposing effect".
- "keep the arithmetic honest" to "keep the arithmetic simple".
- Removed the filler word "actually" in the negative feedback sentence.
- Rewrote the transconductance definition: "how many amperes ... you gain per volt of base to emitter change" to "how much the collector current changes for each volt of change between base and emitter". Same definition, plainer wording.

Clearer antecedents:
- "Ohm's law at the emitter gives it directly" to "gives the current directly".
- "depends mainly on two resistors" to "depends mainly on the two resistors" (the ones in the formula).
- "choosing a point between the two" to "The result lands between the two extremes."
- "the input rides on the base" to "the input enters at the base", matching the diagram description.
- "That is 45 times less than the bypassed gain" to "a factor of 45 smaller", matching the quiz wording. The number 45 is unchanged.

Consistency (compound modifiers hyphenated, matching the title):
- "common emitter stage" to "common-emitter stage".
- "base emitter junction" to "base-emitter junction" (three places).
- "collector to emitter voltage" to "collector-to-emitter voltage" (two places).
- "room temperature value" to "room-temperature value".

Summary wording (allowed by my remit):
- "draw its small-signal model" to "find its small-signal transconductance". The lesson replaces the transistor with its transconductance and never draws a model, so the old wording overpromised.

## Not changed

- All equations, numbers, units, symbols and component values, including 1.8 V, 1.1 V, 1.0 mA, 6.2 V, 40 mS, 25 ohm, -188, -4.18, 45 and the quiz answer 4.8 V.
- Technical terms: biasing, bias point, Q point, active region, transconductance, thermal voltage, coupling capacitor, bypass capacitor, negative feedback, feedback factor, intrinsic emitter resistance.
- The Mermaid block and both quiz components. Their question, options and explanation text is component props, so I left them untouched even where a tweak might read better.
- Frontmatter other than the summary wording.

## Could not fix

- Nothing outstanding. The lint pass is clean and I found no sentence where a readable rewrite would risk the meaning.
