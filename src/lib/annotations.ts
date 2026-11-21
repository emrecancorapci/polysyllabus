/**
 * Annotation store: highlights, bookmarks, and notes attached to part text.
 * Mirrors src/lib/progress.ts — localStorage-backed, validated on read, and
 * broadcast through a window event so page decorations re-render. The DOM
 * anchoring that turns a record back into a visible mark lives in
 * src/lib/annotation-anchor.ts.
 */

export const HIGHLIGHT_COLORS = [
  "yellow",
  "green",
  "blue",
  "pink",
  "orange",
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/** Whitespace-normalized text quote (W3C TextQuoteSelector style). */
export interface TextQuote {
  /** The annotated text, normalized. */
  exact: string;
  /** Up to 32 normalized characters before `exact`; disambiguates repeats. */
  prefix?: string;
  /** Up to 32 normalized characters after `exact`. */
  suffix?: string;
}

export interface Annotation {
  id: string;
  /** Part the text lives in: `<course>/<lesson>/<part>`. */
  partId: string;
  quote: TextQuote;
  color: HighlightColor;
  /** Note body; plain highlights/bookmarks have none. */
  note?: string;
  /** Bookmarked entries appear in the "Bookmarks & notes" panels. */
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ANNOTATIONS_EVENT = "polysyllabus:annotations";

const STORAGE_KEY = "polysyllabus:annotations:v1";
const COLOR_KEY = "polysyllabus:annotation-color";

const EMPTY: Annotation[] = [];

function isTextQuote(value: unknown): value is TextQuote {
  if (typeof value !== "object" || value === null) return false;
  const { exact, prefix, suffix } = value as Record<string, unknown>;
  if (typeof exact !== "string" || exact.length === 0) return false;
  if (prefix !== undefined && typeof prefix !== "string") return false;
  return suffix === undefined || typeof suffix === "string";
}

function isHighlightColor(value: unknown): value is HighlightColor {
  return (HIGHLIGHT_COLORS as readonly string[]).includes(value as string);
}

function isAnnotation(value: unknown): value is Annotation {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.id === "string" &&
    typeof a.partId === "string" &&
    isTextQuote(a.quote) &&
    isHighlightColor(a.color) &&
    (a.note === undefined || typeof a.note === "string") &&
    typeof a.bookmarked === "boolean" &&
    typeof a.createdAt === "string" &&
    typeof a.updatedAt === "string"
  );
}

function isAnnotationList(value: unknown): value is Annotation[] {
  return Array.isArray(value) && value.every(isAnnotation);
}

export function loadAnnotations(): Annotation[] {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return isAnnotationList(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(annotations: Annotation[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  window.dispatchEvent(new CustomEvent(ANNOTATIONS_EVENT));
}

export interface NewAnnotation {
  partId: string;
  quote: TextQuote;
  color: HighlightColor;
  note?: string;
  bookmarked: boolean;
}

/** Factory assigning a fresh id and timestamps. */
export function newAnnotation(spec: NewAnnotation): Annotation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    partId: spec.partId,
    quote: spec.quote,
    color: spec.color,
    ...(spec.note ? { note: spec.note } : {}),
    bookmarked: spec.bookmarked,
    createdAt: now,
    updatedAt: now,
  };
}

/** Inserts or updates one record (matched by id) and broadcasts the change. */
export function upsertAnnotation(annotation: Annotation): void {
  const annotations = loadAnnotations();
  const at = annotations.findIndex((entry) => entry.id === annotation.id);
  if (at >= 0) annotations[at] = annotation;
  else annotations.push(annotation);
  save(annotations);
}

export function removeAnnotation(id: string): void {
  save(loadAnnotations().filter((entry) => entry.id !== id));
}

/** Last-read preferred highlight color; "yellow" until changed. */
export function loadPreferredColor(): HighlightColor {
  if (typeof localStorage === "undefined") return "yellow";
  const value = localStorage.getItem(COLOR_KEY);
  return isHighlightColor(value) ? value : "yellow";
}

export function savePreferredColor(color: HighlightColor): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(COLOR_KEY, color);
}
