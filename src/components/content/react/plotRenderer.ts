import * as Plot from "@observablehq/plot";
import { useEffect, useState } from "react";
import type { Series } from "@/lib/plot-schema";

export interface PlotAxisSpec {
  label: string;
  unit?: string;
  scale?: "linear" | "log";
}

export interface PlotMarker {
  x: number;
  y: number;
  label: string;
}

export interface LinePlotSpec {
  x: PlotAxisSpec;
  y: PlotAxisSpec;
  series: Series[];
  /** Shared explicit x domain, e.g. to align stacked plots. */
  xDomain?: [number, number];
  /** Explicit y domain, e.g. to keep 0 dB visible. */
  yDomain?: [number, number];
  /** Reference markers: dashed crosshair + labelled dot. */
  markers?: PlotMarker[];
  /** Plot width in px; measured from the container by the islands. */
  width?: number;
}

/** Faint grid that does not compete with the data. */
const GRID = "color-mix(in oklch, currentColor 14%, transparent)";

export function useElementWidth<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
): number | null {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

const axisLabel = (axis: PlotAxisSpec): string =>
  axis.unit ? `${axis.label} (${axis.unit})` : axis.label;

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
    width: spec.width ?? 640,
    height: 300,
    marginBottom: 46,
    x: {
      type: spec.x.scale === "log" ? "log" : "linear",
      label: axisLabel(spec.x),
      labelOffset: 34,
      grid: GRID,
      domain: spec.xDomain,
      tickFormat: spec.x.scale === "log" ? engineeringTick : undefined,
    },
    y: {
      type: spec.y.scale === "log" ? "log" : "linear",
      label: axisLabel(spec.y),
      grid: GRID,
      domain: spec.yDomain,
    },
    color: single ? undefined : { legend: true },
    marks: [
      ...spec.series.map((series, index) =>
        single
          ? Plot.line(series.points, {
              stroke: "currentColor",
              strokeWidth: 1.5,
            })
          : Plot.line(series.points, {
              stroke: index,
              strokeWidth: 1.5,
              tip: true,
            }),
      ),
      ...(spec.markers ?? []).flatMap((marker) => [
        Plot.ruleX([marker.x], { stroke: GRID, strokeWidth: 1.5 }),
        Plot.ruleY([marker.y], { stroke: GRID, strokeWidth: 1.5 }),
        Plot.dot([marker], { x: "x", y: "y", fill: "currentColor", r: 3 }),
        Plot.text([marker], {
          x: "x",
          y: "y",
          text: "label",
          dy: -8,
          fill: "currentColor",
          fontSize: 11,
        }),
      ]),
    ],
  });
}

/** 1000000 -> "1M" so log-frequency ticks stay compact. */
function engineeringTick(value: number): string {
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  for (const [suffix, scale] of [
    ["G", 1e9],
    ["M", 1e6],
    ["k", 1e3],
  ] as const) {
    if (magnitude >= scale && magnitude % scale === 0)
      return `${value / scale}${suffix}`;
  }
  return String(value);
}

/** Frequency domain shared by stacked Bode panels. */
export function sharedFrequencyDomain(seriesList: Series[]): [number, number] {
  const values = seriesList.flatMap((series) => series.points.map(([f]) => f));
  return [Math.min(...values), Math.max(...values)];
}

/** Nice y domain that always includes zero (for dB-style magnitudes). */
export function domainIncludingZero(
  values: number[],
  padding = 4,
): [number, number] {
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  return [Math.floor(min) - padding, max];
}
