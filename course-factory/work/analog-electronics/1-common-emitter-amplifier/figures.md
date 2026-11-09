# Figure briefs for lesson 1-common-emitter-amplifier

Status: all figures deferred. The Figure maker does not run in sprint 1, so
`doc.mdx` references no image files and no `fig-*.svg` or `data-*.json` exists.
Implement these briefs in a later sprint, then add a `<Figure>` block with the
markdown image child at the placement noted in each brief.

## fig-ce-stage (deferred)

- What it shows: the complete divider biased common-emitter stage, one schematic, drawn with Schemdraw.
- Placement in doc.mdx: start of "The circuit and its bias", above the component list.
- Labels and symbols: `V_CC` rail at the top, ground rail at the bottom. `R_1` from `V_CC` to the base node, `R_2` from base to ground, `C_in` in series between `v_in` and the base. NPN transistor `Q1` with base at the left, collector at the top, emitter at the bottom. `R_C` from `V_CC` to the collector, `C_out` in series from the collector to `v_out`, `R_E` from emitter to ground, `C_E` in parallel with `R_E`.
- Expected direction of currents and polarity: `V_CC` positive with respect to ground. Conventional current `I_C` flows from `V_CC` down through `R_C` into the collector, and `I_E` flows out of the emitter down through `R_E` to ground. `v_in` and `v_out` are both measured with respect to ground, plus sign on the signal node.
- Alt text: "Common-emitter amplifier schematic with divider bias R_1 and R_2, collector resistor R_C, emitter resistor R_E, bypass capacitor C_E and coupling capacitors C_in and C_out."

## fig-small-signal (deferred)

- What it shows: the reduced small-signal model used for the gain derivation, hybrid-pi style with only `g_m`.
- Placement in doc.mdx: in "The small-signal view", right after the `g_m` equation.
- Labels and symbols: small-signal ground rail at the bottom. `v_in` applied between the base node and ground. A dependent current source `g_m v_be` between the collector node and the emitter node, `R_C` from the collector node to ground, `v_out` marked at the collector node with plus toward the collector and minus toward ground.
- Expected direction of currents and polarity: for positive `v_be` the source arrow points from the collector node toward the emitter node. That current raises the drop on `R_C`, so `v_out` goes negative, which is the inversion.
- Alt text: "Small-signal model with input v_in across the base emitter junction, a dependent current source g_m v_be from collector to emitter and load R_C to ground."

## fig-loadline (deferred)

- What it shows: the DC load line over a few sketched transistor output curves, with the Q point of the worked example.
- Placement in doc.mdx: end of "Worked example: finding the DC bias point".
- Labels and symbols: horizontal axis `V_CE`, vertical axis `I_C`. Load line from `V_CE = 12 V` at `I_C = 0` to `V_CE = 0` at `I_C = V_CC/(R_C + R_E)`, which is about 2.07 mA for the worked example values. Mark the Q point at `V_CE = 6.2 V`, `I_C = 1.0 mA` and label the saturation end near the vertical axis and the cutoff end near the horizontal axis.
- Expected direction of currents and polarity: the load line slopes downward from the upper left to the lower right as `V_CE` grows. The Q point sits near the middle, which is the point of the chosen bias.
- Alt text: "DC load line with the Q point at 6.2 V and 1.0 mA, between the saturation region on the left and cutoff on the right."
