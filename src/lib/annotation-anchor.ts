/**
 * Anchors annotations to article text with whitespace-normalized text quotes
 * (W3C TextQuoteSelector style).
 *
 * MDX sources pretty-print paragraphs with newlines, so the text a reader
 * selects ("a resistor limits current") differs from the raw textContent
 * ("a resistor limits\ncurrent"). An index therefore collapses whitespace
 * runs into single spaces and keeps a per-character map back to DOM
 * positions. A selection serializes to `exact` plus short `prefix`/`suffix`
 * context, which re-locates after reload and survives small content edits
 * around the quote.
 *
 * KaTeX splits its output into many spans (and hides a MathML duplicate of
 * every formula), so `.katex`, `math`, `svg`, scripts, and form controls are
 * excluded: text inside them cannot be highlighted, and a selection that
 * spans a formula anchors only to the plain text around it or degrades to a
 * panel-only entry.
 *
 * Mark painting never relies on live `Range` remapping (wrapping a text node
 * in an element invalidates sibling ranges). Instead every span is computed
 * up front in *original* character coordinates, and a segment map tracks how
 * earlier splits and wraps moved the characters. Overlapping annotations
 * nest naturally: the inner wrap re-anchors inside the outer mark.
 */

import type { Annotation, TextQuote } from "@/lib/annotations";

const SKIP_SELECTOR =
  "script, style, template, math, svg, textarea, select, .katex, [data-no-annotate]";

/** Characters of prefix/suffix context stored around a quote. */
const QUOTE_CONTEXT = 32;
/** Quotes above this length are refused (popovers stay practical). */
const MAX_QUOTE = 2000;

export interface AnchorPoint {
  node: Text;
  /** DOM offset of the indexed character inside its node. */
  offset: number;
}

export interface TextIndex {
  /** Whitespace-normalized concatenation of the annotatable text. */
  text: string;
  /** One entry per character of `text`, in the same order. */
  points: AnchorPoint[];
}

/** A run of characters in one text node, in original (pre-split) offsets. */
export interface CharSpan {
  node: Text;
  start: number;
  end: number;
}

/** True when the text node's characters participate in anchoring. */
export function isAnnotatable(node: Node): boolean {
  const element =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  return element !== null && element.closest(SKIP_SELECTOR) === null;
}

export function buildTextIndex(root: Element): TextIndex {
  const chars: string[] = [];
  const points: AnchorPoint[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      const text = node as Text;
      return isAnnotatable(text) && text.data.length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const data = node.data;
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];
      // Collapse whitespace runs (including the newlines MDX inserts) so
      // selection text matches the index after round-trips.
      if (/\s/.test(ch) && chars[chars.length - 1] === " ") continue;
      chars.push(/\s/.test(ch) ? " " : ch);
      points.push({ node, offset: i });
    }
  }
  return { text: chars.join(""), points };
}

/**
 * Where a DOM position (container, offset) sits in the normalized text:
 * the index of the first point at or after it. Points and `text` are
 * parallel, so this number is both an insertion point and a text position.
 */
function positionOf(index: TextIndex, container: Node, offset: number): number {
  const relation = (candidate: AnchorPoint): number => {
    const node = candidate.node;
    if (container === node) return Math.sign(offset - candidate.offset);
    const mask = container.compareDocumentPosition(node);
    if (mask & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      // container is an element holding the point's node: compare child
      // indexes — the position is before child k when offset <= k.
      let child: Node | null = node;
      while (child && child.parentNode !== container) child = child.parentNode;
      if (child) {
        const at = Array.prototype.indexOf.call(container.childNodes, child);
        return Math.sign(offset - at);
      }
    }
    if (mask & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    return 1;
  };
  let low = 0;
  let high = index.points.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (relation(index.points[mid]) > 0) low = mid + 1;
    else high = mid;
  }
  return low;
}

export interface QuoteSpan {
  start: number;
  end: number;
}

/** Serializes a DOM selection range into a storable quote. */
export function quoteFromDOMRange(
  index: TextIndex,
  range: Range,
): TextQuote | null {
  const start = positionOf(index, range.startContainer, range.startOffset);
  const end = positionOf(index, range.endContainer, range.endOffset);
  return quoteAt(index, start, end);
}

function quoteAt(
  index: TextIndex,
  start: number,
  end: number,
): TextQuote | null {
  let from = Math.max(0, Math.min(start, index.text.length));
  let to = Math.max(0, Math.min(end, index.text.length));
  while (from < to && index.text[from] === " ") from++;
  while (to > from && index.text[to - 1] === " ") to--;
  if (to - from < 1 || to - from > MAX_QUOTE) return null;
  const prefix = index.text.slice(Math.max(0, from - QUOTE_CONTEXT), from);
  const suffix = index.text.slice(to, to + QUOTE_CONTEXT);
  return {
    exact: index.text.slice(from, to),
    ...(prefix ? { prefix } : {}),
    ...(suffix ? { suffix } : {}),
  };
}

/** Re-locates a stored quote in the index; null when the text is gone. */
export function locateQuote(
  index: TextIndex,
  quote: TextQuote,
): QuoteSpan | null {
  const { exact, prefix = "", suffix = "" } = quote;
  if (prefix || suffix) {
    const at = index.text.indexOf(prefix + exact + suffix);
    if (at >= 0)
      return {
        start: at + prefix.length,
        end: at + prefix.length + exact.length,
      };
  }
  const at = index.text.indexOf(exact);
  return at >= 0 ? { start: at, end: at + exact.length } : null;
}

/** DOM-observable character runs covered by a normalized [start, end). */
export function charSpans(
  index: TextIndex,
  start: number,
  end: number,
): CharSpan[] {
  const spans: CharSpan[] = [];
  let i = Math.max(0, Math.min(start, index.points.length));
  const limit = Math.max(i, Math.min(end, index.points.length));
  while (i < limit) {
    const first = index.points[i];
    let lastOffset = first.offset;
    let j = i + 1;
    while (j < limit && index.points[j].node === first.node) {
      lastOffset = index.points[j].offset;
      j++;
    }
    spans.push({ node: first.node, start: first.offset, end: lastOffset + 1 });
    i = j;
  }
  return spans;
}

export function anchorId(id: string): string {
  return `ann-${id}`;
}

/** Tracks how one original text node's characters moved across splits. */
interface Segment {
  node: Text;
  from: number;
  to: number;
}

function segmentsOf(node: Text, map: Map<Text, Segment[]>): Segment[] {
  const existing = map.get(node);
  if (existing) return existing;
  const fresh: Segment[] = [{ node, from: 0, to: node.data.length }];
  map.set(node, fresh);
  return fresh;
}

/** Splits the segment list at an original coordinate, if a boundary is needed. */
function splitSegmentsAt(
  node: Text,
  at: number,
  map: Map<Text, Segment[]>,
): void {
  const segments = segmentsOf(node, map);
  const i = segments.findIndex((seg) => seg.from < at && at < seg.to);
  if (i < 0) return;
  const seg = segments[i];
  const rightNode = seg.node.splitText(at - seg.from);
  segments.splice(
    i,
    1,
    { node: seg.node, from: seg.from, to: at },
    { node: rightNode, from: at, to: seg.to },
  );
}

/**
 * Paints annotations as `<mark data-annotation-id>` elements over the root,
 * replacing any previous marks first. Returns a fresh index of the painted
 * DOM for subsequent selection work. Annotations whose quote no longer
 * matches are skipped (they stay visible in the panels only).
 */
export function paintMarks(
  root: HTMLElement,
  annotations: Annotation[],
): TextIndex {
  for (const mark of [...root.querySelectorAll("mark[data-annotation-id]")]) {
    mark.replaceWith(...mark.childNodes);
  }
  root.normalize();

  const index = buildTextIndex(root);
  const segmentMap = new Map<Text, Segment[]>();

  const anchored: Array<{ span: QuoteSpan; annotation: Annotation }> = [];
  for (const annotation of annotations) {
    const span = locateQuote(index, annotation.quote);
    if (span) anchored.push({ span, annotation });
  }
  // Document order: earlier annotations end up outermost when overlapping.
  anchored.sort((a, b) => a.span.start - b.span.start);

  for (const { span, annotation } of anchored) {
    const spans = charSpans(index, span.start, span.end);
    let anchoredMark = false;
    for (const charSpan of spans) {
      splitSegmentsAt(charSpan.node, charSpan.start, segmentMap);
      splitSegmentsAt(charSpan.node, charSpan.end, segmentMap);
      for (const seg of [...segmentsOf(charSpan.node, segmentMap)]) {
        if (seg.from < charSpan.start || seg.to > charSpan.end) continue;
        if (seg.to <= seg.from) continue;
        const mark = document.createElement("mark");
        mark.dataset.annotationId = annotation.id;
        mark.className = `annotation annotation-${annotation.color}`;
        if (annotation.note) mark.dataset.hasNote = "true";
        if (!anchoredMark) {
          mark.id = anchorId(annotation.id);
          anchoredMark = true;
        }
        seg.node.parentNode?.insertBefore(mark, seg.node);
        mark.appendChild(seg.node);
      }
    }
  }
  return buildTextIndex(root);
}
