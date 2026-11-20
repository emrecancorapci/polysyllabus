/**
 * Lightbox client: opens clicked figures and Mermaid diagrams inside the
 * single <dialog id="figure-lightbox"> rendered by FigureLightbox.astro.
 *
 * The source node is cloned so the reading column keeps its layout. Clones
 * drop the column's size caps (see #figure-lightbox styles in global.css):
 * SVGs scale freely to the dialog and Mermaid loses its max-width. A cloned
 * diagram keeps its id — its internal stylesheet and marker references are
 * id-scoped — so the id is temporarily duplicated while the dialog is open.
 */

const MERMAID_SELECTOR = "svg[id^='mermaid-']";
const ZOOM_SELECTOR = `[data-zoomable], ${MERMAID_SELECTOR}`;

let dialog: HTMLDialogElement | null = null;
let content: HTMLElement | null = null;

function cloneSource(source: Element): Element {
  // Figure sources are real <button>s wrapping the visual; clone the visual
  // only (the dialog itself provides the semantics).
  const visual =
    source.tagName === "BUTTON" ? (source.firstElementChild ?? source) : source;
  const clone = visual.cloneNode(true) as HTMLElement;
  clone.removeAttribute("tabindex");
  // Mermaid diagrams embed an id-scoped internal stylesheet (#mermaid-0 …)
  // and url(#…) marker references, so the clone must keep the id to render.
  // The "mermaid-" prefix keeps the dark-mode inversion selector matching.
  if (clone.id.startsWith("mermaid-")) {
    clone.style.maxWidth = "none";
  }
  return clone;
}

function open(source: Element): void {
  if (!dialog || !content) return;
  content.replaceChildren(cloneSource(source));
  dialog.showModal();
}

/** Astro module scripts run after the DOM is parsed; a single wire() is safe. */
function wire(): void {
  dialog = document.getElementById(
    "figure-lightbox",
  ) as HTMLDialogElement | null;
  if (!dialog) return;
  content = dialog.querySelector<HTMLElement>("[data-lightbox-content]");

  // Mermaid output is plain article SVG with no interactive affordance;
  // give it the same keyboard entry point the Figure blocks have.
  for (const diagram of document.querySelectorAll<SVGElement>(
    MERMAID_SELECTOR,
  )) {
    diagram.setAttribute("tabindex", "0");
    diagram.setAttribute("aria-label", "Enlarge diagram");
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (dialog?.open) {
      // ::backdrop clicks target the dialog itself; the button closes too.
      if (
        event.target === dialog ||
        event.target.closest("[data-lightbox-close]")
      ) {
        close();
      }
      return;
    }
    const source = event.target.closest(ZOOM_SELECTOR);
    if (source && !source.closest("#figure-lightbox")) open(source);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof Element)) return;
    const source = event.target.closest(ZOOM_SELECTOR);
    if (source && !source.closest("#figure-lightbox")) {
      event.preventDefault();
      open(source);
    }
  });
}

function close(): void {
  dialog?.close();
}

export function initLightbox(): void {
  wire();
}
