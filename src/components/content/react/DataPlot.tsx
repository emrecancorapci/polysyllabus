import { useEffect, useRef } from "react";
import type { PlotData } from "@/lib/plot-schema";
import { renderLinePlot } from "./plotRenderer";

export default function DataPlot({ data }: { data: PlotData }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    container.replaceChildren(
      renderLinePlot({ x: data.x, y: data.y, series: data.series }),
    );
  }, [data]);

  return (
    <figure className="border-border bg-card my-6 flex flex-col gap-3 rounded-lg border p-4">
      <figcaption className="text-foreground text-sm font-medium">
        {data.title}
      </figcaption>
      <div ref={containerRef} className="text-foreground w-full" />
    </figure>
  );
}
