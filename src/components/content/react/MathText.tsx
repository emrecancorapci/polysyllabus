import katex from "katex";
import type { ReactNode } from "react";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Renders a string that may contain inline math between dollar delimiters
 * (`$V = IR$`). Serialized props never pass through the markdown pipeline,
 * so islands that show author-written text render the math with KaTeX
 * themselves. Deterministic output, so SSR and hydration match; plain text
 * is HTML-escaped, math is rendered by KaTeX (which escapes by design).
 *
 * MDX does not unescape `\\` in quoted attribute values, so LaTeX written
 * as `\\text` arrives with doubled backslashes; normalize to single. A
 * literal `\\` (line break) is meaningless in inline math, so this is safe.
 */
export default function MathText({ text }: { text: string }): ReactNode {
  const normalized = text.replaceAll("\\\\", "\\");
  const html = normalized
    .split(/(\$[^$]+\$)/g)
    .map((part) =>
      part.startsWith("$") && part.endsWith("$") && part.length > 2
        ? katex.renderToString(part.slice(1, -1), {
            displayMode: false,
            throwOnError: false,
            strict: "ignore",
          })
        : escapeHtml(part),
    )
    .join("");
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output is escaped by design; plain parts are HTML-escaped above; input is trusted lesson content.
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}
