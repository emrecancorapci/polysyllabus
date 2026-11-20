/**
 * Client engine for text annotations. Drives the static markup from
 * components/chrome/Annotations.astro (same decorate-the-server-markup
 * pattern as ProgressEnhance):
 *
 * - paints stored highlights as marks over the part article,
 * - shows the selection popover (highlight with color palette / note),
 * - rebinds the popover to existing marks on click (recolor, note, remove),
 * - renders the "Bookmarks & notes" panels on part and course pages.
 */

import {
  ANNOTATIONS_EVENT,
  HIGHLIGHT_COLORS,
  loadAnnotations,
  loadPreferredColor,
  newAnnotation,
  removeAnnotation,
  savePreferredColor,
  upsertAnnotation,
  type Annotation,
  type HighlightColor,
  type TextQuote,
} from "@/lib/annotations";
import {
  anchorId,
  paintMarks,
  quoteFromDOMRange,
  type TextIndex,
} from "@/lib/annotation-anchor";

const EXCERPT_LENGTH = 96;
/** Delay that lets a mark click win over the collapse-induced hide. */
const HIDE_DELAY_MS = 80;

let initialized = false;
let article: HTMLElement | null = null;
let popover: HTMLElement | null = null;
let index: TextIndex | null = null;
let partId = "";

type PopoverMode = "hidden" | "selection" | "annotation";
let mode: PopoverMode = "hidden";
/** Annotation the popover is bound to (mode "annotation"). */
let activeId: string | null = null;
/** Quote of the current selection (mode "selection"). */
let pendingQuote: TextQuote | null = null;
let color: HighlightColor = "yellow";
let hideTimer: number | undefined;
/** Set when the popover opens; collapse-hides inside the grace window are
 * ignored because Chrome fires `selectionchange` (from the click collapsing
 * the selection) *after* the click that reopened the popover on a mark. */
let shownAt = 0;
const COLLAPSE_GRACE_MS = 250;

function isHighlightColor(value: string | undefined): value is HighlightColor {
  return (HIGHLIGHT_COLORS as readonly string[]).includes(value ?? "");
}

function annotationsFor(scope: string): Annotation[] {
  return loadAnnotations().filter((entry) => entry.partId === scope);
}

function findAnnotation(id: string): Annotation | undefined {
  return loadAnnotations().find((entry) => entry.id === id);
}

function query<T extends Element>(selector: string): T | null {
  return popover?.querySelector<T>(selector) ?? null;
}

type Child = Node | string | null | undefined;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  children: Child[] = [],
  attrs: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    element.append(child);
  }
  return element;
}

/** Clones one of the inline icon <template>s from the markup. */
function cloneIcon(kind: "bookmark" | "note"): Child {
  const template = document.querySelector<HTMLTemplateElement>(
    `[data-icon-${kind}]`,
  );
  return template ? template.content.cloneNode(true) : null;
}

function excerpt(text: string): string {
  return text.length > EXCERPT_LENGTH
    ? `${text.slice(0, EXCERPT_LENGTH)}…`
    : text;
}

function containsNode(scope: Node, node: Node | null): boolean {
  return node !== null && scope.contains(node);
}

function clearSelection(): void {
  document.getSelection()?.removeAllRanges();
}

// ---- Painting and panels -------------------------------------------------

function onStoreChange(): void {
  if (article) index = paintMarks(article, annotationsFor(partId));
  renderPanels();
}

/** One "Bookmarks & notes" list entry linking back to the mark. */
function panelItem(
  annotation: Annotation,
  part?: { title: string; href: string },
): HTMLLIElement {
  const href = part
    ? `${part.href}#${anchorId(annotation.id)}`
    : `#${anchorId(annotation.id)}`;
  const children: Child[] = [
    h("span", "flex items-center gap-1.5", [
      h(
        "span",
        `annotation-swatch-${annotation.color} size-2.5 shrink-0 rounded-full`,
      ),
      h(
        "span",
        "text-foreground group-hover:text-primary min-w-0 flex-1 truncate",
        [excerpt(annotation.quote.exact)],
      ),
      annotation.bookmarked ? cloneIcon("bookmark") : null,
      annotation.note ? cloneIcon("note") : null,
    ]),
  ];
  if (annotation.note) {
    children.push(
      h(
        "span",
        "text-muted-foreground line-clamp-2 text-xs whitespace-pre-wrap",
        [annotation.note],
      ),
    );
  }
  if (part?.title) {
    children.push(h("span", "text-muted-foreground/70 text-xs", [part.title]));
  }
  return h("li", "", [
    h(
      "a",
      "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none group flex flex-col gap-1 rounded-md px-2 py-1.5",
      children,
      { href },
    ),
  ]);
}

function renderPanelScope(
  panel: HTMLUListElement,
  items: HTMLLIElement[],
): void {
  panel.replaceChildren(...items);
  // Sections are server-rendered with the `hidden` attribute; keep using it
  // (the [hidden] CSS rule beats their display utilities).
  panel
    .closest("[data-annotation-section]")
    ?.toggleAttribute("hidden", items.length === 0);
}

function renderPanels(): void {
  const annotations = loadAnnotations();
  const byCreated = (a: Annotation, b: Annotation): number =>
    a.createdAt.localeCompare(b.createdAt);

  for (const panel of document.querySelectorAll<HTMLUListElement>(
    "[data-annotation-panel]",
  )) {
    const scope = panel.dataset.partId ?? "";
    renderPanelScope(
      panel,
      annotationsFor(scope)
        .sort(byCreated)
        .map((annotation) => panelItem(annotation)),
    );
  }

  for (const list of document.querySelectorAll<HTMLUListElement>(
    "[data-annotation-list]",
  )) {
    const lessonId = list.dataset.lesson ?? "";
    // Part metadata is server-rendered next to the list (the list itself is
    // re-rendered by this function, so it cannot hold the metadata).
    const scope = list.closest("[data-annotation-section]") ?? list;
    const metas = new Map<string, { title: string; href: string }>();
    for (const meta of scope.querySelectorAll<HTMLElement>(
      "[data-annotation-part]",
    )) {
      if (meta.dataset.partId) {
        metas.set(meta.dataset.partId, {
          title: meta.dataset.partTitle ?? "",
          href: meta.dataset.partHref ?? "",
        });
      }
    }
    renderPanelScope(
      list,
      annotations
        .filter((entry) => entry.partId.startsWith(`${lessonId}/`))
        .sort(byCreated)
        .map((annotation) =>
          panelItem(annotation, metas.get(annotation.partId)),
        ),
    );
  }
}

function scrollHashIntoView(): void {
  const hash = window.location.hash;
  if (!hash.startsWith(`#${anchorId("")}`)) return;
  document.getElementById(hash.slice(1))?.scrollIntoView({ block: "center" });
}

// ---- Popover -------------------------------------------------------------

function setSection(name: "toolbar" | "editor"): void {
  closePalette();
  query("[data-toolbar]")?.toggleAttribute("hidden", name !== "toolbar");
  query("[data-editor]")?.toggleAttribute("hidden", name !== "editor");
}

function closePalette(): void {
  query("[data-palette]")?.toggleAttribute("hidden", true);
  query("[data-action=palette]")?.setAttribute("aria-expanded", "false");
}

function togglePalette(): void {
  const palette = query("[data-palette]");
  if (!palette) return;
  const show = palette.hasAttribute("hidden");
  palette.toggleAttribute("hidden", !show);
  query("[data-action=palette]")?.setAttribute("aria-expanded", String(show));
}

function setColor(next: string | undefined): void {
  if (!isHighlightColor(next)) return;
  color = next;
  savePreferredColor(color);
  query("[data-color-dot]")?.setAttribute(
    "class",
    `annotation-swatch-${color} h-1 w-5 rounded-full`,
  );
  for (const swatch of queryAll<HTMLButtonElement>("[data-color]")) {
    swatch.setAttribute("aria-pressed", String(swatch.dataset.color === color));
  }
  if (mode === "annotation" && activeId) {
    const annotation = findAnnotation(activeId);
    if (annotation && annotation.color !== color) {
      upsertAnnotation({
        ...annotation,
        color,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

function queryAll<T extends Element>(selector: string): T[] {
  return [...(popover?.querySelectorAll<T>(selector) ?? [])];
}

/** Syncs button states to the current mode, before the popover is shown. */
function renderPopoverChrome(): void {
  setSection("toolbar");
  setColor(color);
  const existing =
    mode === "annotation" && activeId ? findAnnotation(activeId) : undefined;
  const removable = mode === "annotation" && activeId !== null;
  query("[data-action=remove]")?.toggleAttribute("hidden", !removable);
  query("[data-remove-divider]")?.toggleAttribute("hidden", !removable);
  const noteLabel = query("[data-note-label]");
  if (noteLabel) noteLabel.textContent = existing?.note ? "Edit note" : "Note";
}

function positionPopover(rect: DOMRect): void {
  if (!popover) return;
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  let top = rect.top - height - 10;
  if (top < 8) {
    top = Math.min(rect.bottom + 10, window.innerHeight - height - 8);
  }
  popover.style.left = `${Math.round(Math.max(8, left))}px`;
  popover.style.top = `${Math.round(Math.max(8, top))}px`;
}

function showPopover(
  next: Exclude<PopoverMode, "hidden">,
  rect: DOMRect,
): void {
  if (!popover) return;
  mode = next;
  renderPopoverChrome();
  popover.hidden = false;
  shownAt = Date.now();
  positionPopover(rect);
}

function hidePopover(): void {
  mode = "hidden";
  activeId = null;
  pendingQuote = null;
  if (popover) popover.hidden = true;
}

function onHighlightClick(): void {
  if (mode === "selection" && pendingQuote && partId) {
    upsertAnnotation(
      newAnnotation({
        partId,
        quote: pendingQuote,
        color,
        bookmarked: true,
      }),
    );
    clearSelection();
    hidePopover();
  } else if (mode === "annotation") {
    // Live recolor already happened via the palette; close.
    hidePopover();
  }
}

function openEditor(): void {
  const input = query<HTMLTextAreaElement>("[data-note-input]");
  if (!input) return;
  const existing =
    mode === "annotation" && activeId ? findAnnotation(activeId) : undefined;
  input.value = existing?.note ?? "";
  setSection("editor");
  input.focus();
}

function saveNote(): void {
  const note = query<HTMLTextAreaElement>("[data-note-input]")?.value.trim();
  if (mode === "selection" && pendingQuote && partId) {
    if (!note) {
      hidePopover();
      return;
    }
    upsertAnnotation(
      newAnnotation({
        partId,
        quote: pendingQuote,
        color,
        note,
        bookmarked: false,
      }),
    );
  } else if (mode === "annotation" && activeId) {
    const annotation = findAnnotation(activeId);
    if (annotation) {
      upsertAnnotation({
        ...annotation,
        note: note || undefined,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  clearSelection();
  hidePopover();
}

function onRemoveClick(): void {
  if (!activeId) return;
  removeAnnotation(activeId);
  clearSelection();
  hidePopover();
}

function onSelectionChange(): void {
  if (!popover || popover.contains(document.activeElement)) return;
  if (hideTimer !== undefined) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    hideTimer = undefined;
    if (!popover || popover.contains(document.activeElement)) return;
    if (Date.now() - shownAt < COLLAPSE_GRACE_MS) return;
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      if (mode !== "hidden") hidePopover();
      return;
    }
    if (!article || !index) return;
    if (
      !containsNode(article, selection.anchorNode) ||
      !containsNode(article, selection.focusNode)
    ) {
      hidePopover();
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const quote = quoteFromDOMRange(index, range);
    if (!quote) return;
    pendingQuote = quote;
    activeId = null;
    showPopover("selection", range.getBoundingClientRect());
  }, HIDE_DELAY_MS);
}

function onArticleClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const mark = event.target.closest<HTMLElement>("mark[data-annotation-id]");
  if (!mark) return;
  const selection = document.getSelection();
  if (selection && !selection.isCollapsed) return; // user is selecting
  const annotation = findAnnotation(mark.dataset.annotationId ?? "");
  if (!annotation || !popover) return;
  if (hideTimer !== undefined) {
    window.clearTimeout(hideTimer);
    hideTimer = undefined;
  }
  color = annotation.color;
  activeId = annotation.id;
  pendingQuote = null;
  showPopover("annotation", mark.getBoundingClientRect());
}

function onPointerDown(event: PointerEvent): void {
  if (mode === "hidden" || !popover) return;
  if (popover.contains(event.target as Node)) return;
  if (
    event.target instanceof Element &&
    event.target.closest("mark[data-annotation-id]")
  ) {
    return;
  }
  hidePopover();
}

function onScrollHide(event: Event): void {
  if (mode === "hidden" || !popover) return;
  if (event.target instanceof Node && popover.contains(event.target)) return;
  hidePopover();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && mode !== "hidden") hidePopover();
}

function wirePopover(): void {
  query("[data-action=highlight]")?.addEventListener("click", onHighlightClick);
  query("[data-action=palette]")?.addEventListener("click", togglePalette);
  query("[data-action=note]")?.addEventListener("click", openEditor);
  query("[data-action=note-save]")?.addEventListener("click", saveNote);
  query("[data-action=note-cancel]")?.addEventListener("click", () => {
    hidePopover();
  });
  query("[data-action=remove]")?.addEventListener("click", onRemoveClick);
  query<HTMLTextAreaElement>("[data-note-input]")?.addEventListener(
    "keydown",
    (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        saveNote();
      }
    },
  );
  for (const swatch of queryAll<HTMLButtonElement>("[data-color]")) {
    swatch.addEventListener("click", () => setColor(swatch.dataset.color));
  }
}

export function initAnnotations(): void {
  if (initialized) return;
  initialized = true;

  article = document.querySelector<HTMLElement>("article.article-prose");
  popover = document.getElementById("annotation-popover");
  partId = popover?.dataset.partId ?? "";
  color = loadPreferredColor();

  if (article) {
    index = paintMarks(article, annotationsFor(partId));
    article.addEventListener("click", onArticleClick);
    scrollHashIntoView();
  }
  if (popover) wirePopover();

  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", onScrollHide, {
    capture: true,
    passive: true,
  });
  window.addEventListener("resize", hidePopover);
  window.addEventListener(ANNOTATIONS_EVENT, onStoreChange);
  renderPanels();
}
