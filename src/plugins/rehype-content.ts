/**
 * Rehype plugin that prepares declarative content components before rendering.
 *
 * - `<Figure caption="...">![alt](./file.svg)</Figure>`: validates the inner
 *   markdown image (required non-empty alt), resolves the relative src to a
 *   repo-absolute path, injects the per-lesson figure label ("2.1"), and
 *   drops the image child so it is not bundled twice.
 * - `<Mermaid>`: rewrites the component to a fenced `language-mermaid` code
 *   block so the existing build-time rehype-mermaid pipeline renders it.
 *
 * Runs on Markdown and MDX; on plain Markdown (no JSX) it is a no-op.
 */
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";

interface HastNode {
  type: string;
  name?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  attributes?: Array<{ type: string; name: string; value?: unknown }>;
  children?: HastNode[];
}

interface PluginFile {
  path?: string;
  data?: { astro?: { frontmatter?: Record<string, unknown> } };
}

function attribute(node: HastNode, name: string): unknown {
  return node.attributes?.find((attr) => attr.name === name)?.value;
}

/** Mermaid diagrams: text only, with <br/> preserved; anything else fails. */
function collectDiagramText(node: HastNode, file: PluginFile): string {
  if (node.type === "text") return node.value ?? "";
  if (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") {
    if (node.name === "br") return "<br/>";
    fail(
      `<Mermaid> in ${file.path ?? "unknown file"}: children may only contain text and <br/> (found <${node.name}>)`,
    );
  }
  if (node.tagName === "br") return "<br/>";
  return (node.children ?? [])
    .map((child) => collectDiagramText(child, file))
    .join("");
}

function dedent(text: string): string {
  const lines = text.replace(/\r/g, "").split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^ */)?.[0].length ?? 0);
  const strip = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(strip)).join("\n");
}

function flattenElements(node: HastNode): HastNode[] {
  const children = node.children ?? [];
  return children.flatMap((child) =>
    child.type === "element" || child.type.startsWith("mdxJsx")
      ? [child, ...flattenElements(child)]
      : [],
  );
}

function fail(message: string): never {
  throw new Error(`[content] ${message}`);
}

/** mdxJsxAttribute values can be string | number | boolean | expressions. */
function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(asText).join("");
  return "";
}

function resolveSrc(src: string, file: PluginFile): string {
  const absolute = isAbsolute(src) ? src : join(dirname(file.path ?? "."), src);
  const repoRelative = `/${relative(process.cwd(), absolute)}`;
  if (!repoRelative.startsWith("/src/docs/courses/")) {
    fail(
      `<Figure> src "${src}" in ${file.path ?? "unknown file"} resolves outside the content directory`,
    );
  }
  return repoRelative;
}

/**
 * Figure numbers are lesson.part.figure, so the plugin reads the lesson's
 * order from the lesson.json two levels above the part's doc.mdx.
 */
function readLessonOrder(partPath: string): number {
  const lessonJsonPath = join(dirname(dirname(partPath)), "lesson.json");
  try {
    const lesson = JSON.parse(readFileSync(lessonJsonPath, "utf8")) as {
      order?: unknown;
    };
    return Number(lesson.order ?? Number.NaN);
  } catch {
    return Number.NaN;
  }
}

export function rehypeContent() {
  return (tree: HastNode, file: PluginFile) => {
    const figureCounters = new Map<string, number>();

    const transformFigure = (node: HastNode): void => {
      const img = flattenElements(node).find(
        (child) => child.tagName === "img",
      );
      if (!img) {
        fail(
          `<Figure> in ${file.path ?? "unknown file"} must contain a markdown image: <Figure caption="...">![alt](./file.svg)</Figure>`,
        );
      }

      const rawAlt = img.properties?.alt;
      const alt = asText(rawAlt).trim();
      if (alt === "") {
        fail(
          `<Figure> in ${file.path ?? "unknown file"} is missing alt text on its image`,
        );
      }

      const caption = asText(attribute(node, "caption")).trim();
      if (caption === "") {
        fail(
          `<Figure> "${alt}" in ${file.path ?? "unknown file"} is missing the caption prop`,
        );
      }

      const partOrder = Number(
        file.data?.astro?.frontmatter?.order ?? Number.NaN,
      );
      if (!Number.isFinite(partOrder)) {
        fail(
          `<Figure> "${alt}" in ${file.path ?? "unknown file"}: part frontmatter has no numeric order`,
        );
      }
      const lessonOrder = readLessonOrder(file.path ?? "");
      if (!Number.isFinite(lessonOrder)) {
        fail(
          `<Figure> "${alt}" in ${file.path ?? "unknown file"}: cannot read a numeric order from the lesson's lesson.json`,
        );
      }

      const key = file.path ?? "";
      const figureIndex = (figureCounters.get(key) ?? 0) + 1;
      figureCounters.set(key, figureIndex);

      node.attributes = [
        ...(node.attributes ?? []).filter(
          (attr) => !["src", "alt", "figureLabel"].includes(attr.name),
        ),
        {
          type: "mdxJsxAttribute",
          name: "src",
          value: resolveSrc(asText(img.properties?.src), file),
        },
        { type: "mdxJsxAttribute", name: "alt", value: alt },
        {
          type: "mdxJsxAttribute",
          name: "figureLabel",
          value: `${lessonOrder}.${partOrder}.${figureIndex}`,
        },
      ];
      node.children = [];
    };

    const visit = (node: HastNode): void => {
      for (const [index, child] of (node.children ?? []).entries()) {
        if (child.type === "mdxJsxFlowElement" && child.name === "Figure") {
          transformFigure(child);
        } else if (
          child.type === "mdxJsxFlowElement" &&
          child.name === "DataPlot"
        ) {
          const src = asText(attribute(child, "src")).trim();
          if (src === "") {
            fail(
              `<DataPlot> in ${file.path ?? "unknown file"} requires src="./data.json"`,
            );
          }
          child.attributes = [
            ...(child.attributes ?? []).filter((attr) => attr.name !== "src"),
            {
              type: "mdxJsxAttribute",
              name: "src",
              value: resolveSrc(src, file),
            },
          ];
        } else if (
          child.type === "mdxJsxFlowElement" &&
          child.name === "Mermaid"
        ) {
          const diagram = dedent(
            (child.children ?? [])
              .map((descendant) => collectDiagramText(descendant, file))
              .join(""),
          ).trim();
          if (diagram === "") {
            fail(
              `<Mermaid> in ${file.path ?? "unknown file"} is empty — write the diagram as children`,
            );
          }
          node.children = (node.children ?? []).map((existing, i) =>
            i === index
              ? {
                  type: "element",
                  tagName: "pre",
                  properties: {},
                  children: [
                    {
                      type: "element",
                      tagName: "code",
                      properties: { className: ["language-mermaid"] },
                      children: [{ type: "text", value: diagram }],
                    },
                  ],
                }
              : existing,
          );
        }
        visit(child);
      }
    };
    visit(tree);
  };
}
