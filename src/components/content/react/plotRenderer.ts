import * as Plot from "@observablehq/plot";
import type { Series } from "@/lib/plot-schema";

export interface PlotAxisSpec {
  label: string;
  unit?: string;
  scale?: "linear" | "log";
}

export interface LinePlotSpec {
  x: PlotAxisSpec;
  y: PlotAxisSpec;
  series: Series[];
  /** Shared explicit x domain, e.g. to align stacked plots. */
  xDomain?: [number, number];
}

const axisLabel = (axis: PlotAxisSpec): string =>
  axis.unit ? `${axis.label} (${axis.unit})` : axis.label;

const plotOptions = (
  axis: PlotAxisSpec,
): { type: "linear" | "log"; label: string } => ({
  type: axis.scale === "log" ? "log" : "linear",
  label: axisLabel(axis),
});

/**
 * Renders one line chart into a detached node. Axes, grid, and labels use
 * currentColor, so the chart follows the page theme; series use Plot's
 * categorical scheme when there is more than one.
 */
export function renderLinePlot(
  spec: LinePlotSpec,
): HTMLElement | SVGSVGElement {
  const single = spec.series.length === 1;
  return Plot.plot({
    style: { color: "currentColor", background: "transparent" },
    width: 640,
    height: 300,
    x: { ...plotOptions(spec.x), grid: true, domain: spec.xDomain },
    y: { ...plotOptions(spec.y), grid: true },
    color: single ? undefined : { legend: true },
    marks: spec.series.map((series, index) =>
      single
        ? Plot.line(series.points, { stroke: "currentColor", strokeWidth: 1.5 })
        : Plot.line(series.points, {
            stroke: index,
            strokeWidth: 1.5,
            tip: true,
          }),
    ),
  });
}

/** Frequency domain shared by stacked Bode panels. */
export function sharedFrequencyDomain(seriesList: Series[]): [number, number] {
  const values = seriesList.flatMap((series) => series.points.map(([f]) => f));
  return [Math.min(...values), Math.max(...values)];
}
