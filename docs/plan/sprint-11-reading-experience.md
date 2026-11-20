# Sprint 11 — Reading Experience: Figure Lightbox, Full Width, Text Size

**Status:** Done

## Goal

Dense diagrams become readable and the reading layout adapts to the reader. Clicking a
figure or a Mermaid flowchart opens it larger in a lightbox. Two new buttons sit next to the
dark-mode toggle: a **full-width mode** toggle (the side rails slide away and reappear only
when the mouse moves close to the screen edge) and a **text size** cycler for the article.

## Backlog

- [x] S11-1 **Figure lightbox.** Click (or Enter/Space on keyboard focus) enlarges a figure:
      `Figure` SVG blocks and PNG images are real `<button data-zoomable>` wrappers; Mermaid
      diagrams (`svg[id^="mermaid-"]`) are picked up by the lightbox's delegated handler and
      get a tabindex. A single native `<dialog>` clones the node, drops the column's size caps
      (`max-h-96`, mermaid `max-width`), and scales it to the viewport. Esc, the close button,
      or a backdrop click closes it. The clone keeps the diagram's id — its internal
      stylesheet and `url(#…)` marker references are id-scoped, so renaming rendered black
      boxes — which also keeps the dark-mode palette inversion (`svg[id^="mermaid-"]`)
      matching. Interactive islands (Quiz, Playground, DataPlot, BodePlot) stay excluded.
- [x] S11-2 **Reading controls.** Two `icon-sm` ghost buttons next to the theme toggle:
      full-width toggle (`unfold-horizontal`, `aria-pressed`) and text-size cycler
      (`a-large-small`, default → large → x-large → default). Both persist in localStorage and
      are applied in the `ThemeInit` inline script before first paint, so nothing shifts after
      load.
- [x] S11-3 **Full-width reading mode.** `html[data-fullwidth]` widens the part-page layout
      beyond `max-w-6xl` and turns the side rails into fixed overlays that slide out
      (transform + opacity transition; reduced-motion respected). Moving the mouse within
      ~17rem of the left edge slides the outline in; ~15rem of the right edge slides "On this
      page" in; leaving the window hides both. Keyboard focus inside a rail (`:focus-within`)
      also reveals it. Rails get a translucent blurred surface with border and shadow while
      overlaying text.
- [ ] S11-4 **Article font selection** (future): serif/sans toggle for the article body;
      needs a type ramp decision before building.
- [ ] S11-5 **Lightbox zoom & pan** (future): wheel/pinch zoom and drag panning inside the
      lightbox for very large diagrams.
- [ ] S11-6 **Ask AI on the selection** (future, from sprint 10): third popover action asking
      for a simpler / deeper explanation of the selected text; needs an LLM endpoint decision.
- [ ] S11-7 **Listen to a part** (future, from sprint 10): voice generation for courses.
      Cheapest route is the browser's built-in `speechSynthesis` (no service, per-sentence
      highlighting); a hosted TTS gives better voices at a cost.

## Acceptance criteria

- Clicking a Figure, Mermaid diagram, or PNG figure opens the lightbox with the content
  larger than the column; Esc/button/backdrop close it; keyboard focus + Enter works; the
  mermaid dark-mode inversion still works in the lightbox.
- The two new header buttons toggle full-width mode and cycle the article text size; both
  survive a reload with no post-load layout shift.
- In full-width mode the rails are hidden and slide in when the mouse nears the screen edge,
  with a smooth transition; the article column uses the freed width.
- Default (non-full-width) layout, including the existing sticky rails, is unchanged.
- `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.

## Notes

- Lightbox uses the native `<dialog>`: focus trap, Esc, and `::backdrop` come free.
- Full-width mode is desktop-only in effect — rails are `hidden` below lg/xl anyway, and
  touch devices have no hover; the toggle button still works everywhere.
- Text size scales only the article prose (`.article-prose`), not the chrome; math, code, and
  figures scale with it naturally (em-based sizing).

## Verification log

- 2026-11-20: headless-browser E2E on the built site (playwright, 28 checks, all pass):
  Figure button opens the lightbox with an svg strictly larger than inline and the `max-h-96`
  cap dropped; Escape and the close button dismiss it; keyboard Enter on a focused figure
  opens it; clicking a Mermaid diagram clones it with `max-width: none`, rendering wider than
  inline, palette intact (node fill not the default black — the clone must keep its id since
  the diagram's internal stylesheet and marker references are id-scoped); the dark-mode
  inversion selector still matches the clone. Full-width toggle sets `html[data-fullwidth]`,
  slides both rails off-screen, reveals the outline when the pointer nears the left edge and
  "On this page" near the right, hides them again when the pointer leaves, widens the article
  past 1200px, persists across reload with correct `aria-pressed`, and toggles back cleanly.
  Text size cycles default → large → x-large → default with computed font sizes 17 → 19 →
  21px, persists across reload, and restores the default. Rails return to static sticky
  layout when the mode is off; zero console errors. Screenshots confirmed the lightbox, the
  left-rail reveal, and the right-rail reveal.
- 2026-11-20: fixed while verifying — (1) `aria-pressed` was not synced with the state
  `ThemeInit` applied before first paint; (2) renaming the cloned mermaid id broke its
  id-scoped internal stylesheet (black boxes) — the id is now kept and the max-width released
  instead; (3) `role="button"` wrappers failed a11y lint — replaced with real `<button>`
  elements, and the lightbox clones the visual child instead of the button.
- 2026-11-20: user report — the lightbox opened top-left instead of centered. Cause: Tailwind
  v4's preflight resets `margin` on every element, defeating the UA stylesheet's
  `margin: auto` centering for modal dialogs. Fixed with `margin: auto` on
  `dialog#figure-lightbox`; verified the dialog's left/right and top/bottom viewports margins
  are equal (43px each) in the built site.
- 2026-11-20: `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.
