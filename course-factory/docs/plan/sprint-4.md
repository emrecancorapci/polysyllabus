# Sprint 4: Figures and figure evaluation

**Status:** Todo

## Goal

Lessons get code-generated circuits, plots and diagrams, and a separate evaluator checks them against the text. Errors like a reversed current arrow or a missing polarity mark are caught.

## Backlog

- [ ] S4-1 Figure maker produces circuit SVGs with Schemdraw from the Writer's `figures.md` briefs, and keeps the generating scripts in `figure-src/`.
- [ ] S4-2 Figure maker also writes a `.cir` netlist for each circuit, so topology can be compared with the drawing.
- [ ] S4-3 Plot pipeline: matplotlib to SVG, and JSON data files for the frontend's data plot components. Numbers come from code only.
- [ ] S4-4 Check how the frontend's `<Figure>` embeds SVG. `currentColor` only follows the theme when the SVG is inlined. Adjust `svg_normalize.py` or the component if needed.
- [ ] S4-5 Trim empty canvas space: use tight bounding boxes in matplotlib and check Schemdraw output. Add trimming to `svg_normalize.py` if needed.
- [ ] S4-6 Figure evaluator: render SVG to PNG, view it, and run the checklist (labels, polarity, current direction, node dots, values, probe point, readability).
- [ ] S4-7 Netlist versus text check: simulate or parse the `.cir` and compare with the values and gains in the lesson.
- [ ] S4-8 Build a figure mutation set: reversed current arrow, swapped polarity, missing node dot, wrong label, wrong value. Record the catch rate.

## Acceptance criteria

- Figures render correctly in light and dark mode in the built frontend.
- The seeded figure errors are caught at a rate of at least 90 percent.
- Every circuit figure has a netlist and a passing evaluator review.

## Notes

- Do not make raster images of circuits. Raster images are only for photos with a recorded open license.
- Redraw figures from textbooks instead of copying them.

## Verification log

(empty)
