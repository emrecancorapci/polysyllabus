import { useEffect, useRef } from "react";
import type { BodeData } from "@/lib/plot-schema";
import { renderLinePlot, sharedFrequencyDomain } from "./plotRenderer";

/**
 * Bode preset: magnitude (dB) and phase (degrees) stacked on a shared,
 * aligned log-frequency axis.
 */
export default function BodePlot({ data }: { data: BodeData }) {
  const magnitudeRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const domain = sharedFrequencyDomain([data.magnitude, data.phase]);
    const frequencyAxis = {
      label: data.frequency.unit
        ? `${data.frequency.label} (${data.frequency.unit})`
        : data.frequency.label,
    };
    const magnitude = magnitudeRef.current;
    const phase = phaseRef.current;
    if (magnitude === null || phase === null) return;

    magnitude.replaceChildren(
      renderLinePlot({
        x: { ...frequencyAxis, scale: "log" },
        y: { label: "Magnitude (dB)" },
        series: [data.magnitude],
        xDomain: domain,
      }),
    );
    phase.replaceChildren(
      renderLinePlot({
        x: { ...frequencyAxis, scale: "log" },
        y: { label: "Phase (°)" },
        series: [data.phase],
        xDomain: domain,
      }),
    );
  }, [data]);

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
