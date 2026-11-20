# Sprint 10 — Text Annotations: Highlights, Bookmarks, Notes

**Status:** In progress

## Goal

Reading becomes active: selecting text in a part opens a popover above the selection with
**Highlight** (five marker colors; the button shows the current color; a chevron opens the
palette) and **Note** (plain-text editor for now). Highlighting a text also **bookmarks** it.
Bookmarks and notes appear in the part page's right side panel and on the course page under
their lesson; clicking an entry opens the part at the highlighted text (hash link + flash),
like a markdown link.

## Backlog

- [x] S10-1 **Annotation store.** `src/lib/annotations.ts` mirrors `progress.ts`: validated
      localStorage (`study-helper:annotations:v1`), one record per annotated span (`id`, `partId`,
      text quote, `color`, optional `note`, `bookmarked` flag, timestamps), a change event, and the
      preferred highlight color as a separate key.
- [x] S10-2 **Text-quote anchoring.** `src/lib/annotation-anchor.ts` indexes the article's
      text with whitespace normalization (MDX sources contain newlines that render as spaces), so a
      selection serializes to `exact` + 32-char `prefix`/`suffix` (W3C TextQuoteSelector style) and
      re-locates after reload. Mark painting wraps the located text in `<mark data-annotation-id>`
      (multi-line safe via `box-decoration-break: clone`, overlapping annotations nest). Content
      that changed since the annotation was made degrades to a panel-only entry; KaTeX, Mermaid
      SVG, code-embedded widgets and other excluded subtrees are not annotatable.
- [x] S10-3 **Selection popover & highlights.** Non-collapsed selections inside the article
      open the popover above the selection (clamped to the viewport). Split Highlight button:
      highlighter icon over a bar in the current color, chevron toggles the palette. Clicking a
      mark reopens the popover bound to that annotation (recolor live, remove unwraps). Color
      preference persists across visits.
- [x] S10-4 **Notes.** The popover's Note action opens a plain-text editor (`textarea`,
      Ctrl/Cmd+Enter saves; a markdown editor is future work). Notes are marked with a dotted
      underline and listed with an excerpt and the note body. Saving an empty text removes the
      note; a note record is distinct from a bookmark (highlight button bookmark, note button not).
- [x] S10-5 **Panels and cross-page links.** Part page: "Bookmarks & notes" section in the
      right rail (desktop xl) and a `<details>` under the article (mobile/tablet). Course page:
      one section per lesson listing that lesson's annotations with part titles (there is no
      separate lesson page — the course page is the lesson listing). Entries link to
      `#ann-<id>`; marks carry that id, so navigation is a plain anchor jump with a `:target`
      flash and a post-render scroll fallback for cross-page links.
- [ ] S10-6 **Ask AI on the selection** (future): third popover action asking for a simpler /
      deeper explanation of the selected text; needs an LLM endpoint decision.
- [ ] S10-7 **Listen to a part** (future): voice generation for courses. Cheapest route is the
      browser's built-in `speechSynthesis` (no service, per-sentence highlighting); a hosted TTS
      would give better voices at a cost. Not started.

## Acceptance criteria

- Selecting article text shows the popover; Highlight wraps the selection in a colored mark
  and creates a bookmark; Note opens the editor and stores the text.
- Marks survive a reload (re-anchored from the stored quote); panel entries appear on the part
  page rail and the course page lesson; clicking an entry scrolls to the mark and flashes it.
- Clicking a mark allows recolor, note edit, and removal; removal clears the marks and panels.
- Annotations are per-part in storage; panels list only the current part (part page) or the
  lesson's parts (course page); nothing breaks on pages/browsers without `localStorage`.
- `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` all pass.

## Notes

- The spec's "lesson page" does not exist as a route: lessons are listed on the course page
  (`/[course]/`), so lesson-level bookmark/note lists live there, under each lesson section.
- Storage keys keep the `study-helper:` prefix like progress/theme so future renames survive.
- One record covers highlight + bookmark + note for a span (`note`/`bookmarked` optional
  flags); the panel lists all annotations of the scope with type icons.
- Data loss modes: content regenerated so the quote no longer matches (entry stays in the
  panel, link goes nowhere) and browser storage cleared. Both acceptable for a personal tool.
- Excluded from anchoring: `.katex` (markup splits characters and hides a MathML duplicate),
  `svg`/`math` (Mermaid figures), `script`/`style`/`template`/form controls.

## Verification log

- 2026-11-20: headless-browser E2E over the built site (playwright, 22 checks, all pass):
  selection opens the popover; Highlight paints `mark.annotation-yellow` and a rail panel
  entry; reload re-anchors from the stored quote; the panel link jumps to the mark and
  flashes it (`:target`); a two-paragraph selection wraps each text run (4 marks) with exactly
  one anchor id; the note editor stores the text (dotted underline + note body in the panel);
  clicking a mark reopens the popover with Remove; palette green recolors live; course page
  lesson section lists all three annotations with part titles and `#ann-…` links; cross-page
  link lands on the mark; remove unwraps and empties the panel entry; Escape dismisses; zero
  console errors. Screenshots confirmed light and dark rendering.
- 2026-11-20: fixed while verifying — Chrome fires `selectionchange` _after_ the `click`
  that reopens the popover on a mark (the click collapses the selection), so the collapse
  handler scheduled after the popover opened would close it 80 ms later. Collapse-hides are
  now ignored within 250 ms of the popover opening (outside clicks still hide immediately
  via `pointerdown`).
- 2026-11-20: `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm build` pass (153 pages —
  includes the uncommitted generated courses). `pnpm lint:content` not run: no content files
  changed. The client engine lands at 509 lines, one commit over the ~400-line guideline
  (splitting the popover engine was less readable than one module; noted per AGENTS.md).
