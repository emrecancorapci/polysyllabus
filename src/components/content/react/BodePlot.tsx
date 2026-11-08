import { useEffect, useRef } from "react";
import type { BodeData } from "@/lib/plot-schema";
import {
  domainIncludingZero,
  renderLinePlot,
  sharedFrequencyDomain,
  useElementWidth,
} from "./plotRenderer";

/**
 * Bode preset: magnitude (dB) and phase (degrees) stacked on a shared,
 * aligned log-frequency axis. An optional `cutoff` draws the −3 dB marker.
 */
export default function BodePlot({ data }: { data: BodeData }) {
  const magnitudeRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(magnitudeRef);

  useEffect(() => {
    const magnitude = magnitudeRef.current;
    const phase = phaseRef.current;
    if (magnitude === null || phase === null || width === null) return;

    const domain = sharedFrequencyDomain([data.magnitude, data.phase]);
    const frequencyAxis = {
      label: data.frequency.unit
        ? `${data.frequency.label} (${data.frequency.unit})`
        : data.frequency.label,
      scale: "log" as const,
    };
    const yDomain = domainIncludingZero(
      data.magnitude.points.map(([, dB]) => dB),
    );

    magnitude.replaceChildren(
      renderLinePlot({
        x: frequencyAxis,
        y: { label: "Magnitude (dB)" },
        series: [data.magnitude],
        xDomain: domain,
        yDomain,
        width,
        markers:
          data.cutoff !== undefined
            ? [{ x: data.cutoff, y: -3, label: "−3 dB" }]
            : undefined,
      }),
    );
    phase.replaceChildren(
      renderLinePlot({
        x: frequencyAxis,
        y: { label: "Phase (°)" },
        series: [data.phase],
        xDomain: domain,
        width,
      }),
    );
  }, [data, width]);

  return (
    <figure className="border-border bg-card my-6 flex flex-col gap-3 rounded-lg border p-4">
      <figcaption className="text-foreground text-sm font-medium">
        {data.title}
      </figcaption>
      <div ref={magnitudeRef} className="text-foreground w-full" />
      <div ref={phaseRef} className="text-foreground w-full" />
    </figure>
  );
}
