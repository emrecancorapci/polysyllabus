import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaygroundParam, PlaygroundSpec } from "@/lib/playground-schema";
import {
  domainIncludingZero,
  renderLinePlot,
  useElementWidth,
} from "./plotRenderer";

/** mathjs is large; load it only when the island hydrates. */
type MathJs = Awaited<typeof import("mathjs")>;

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1e5 || magnitude < 1e-3)) {
    return value.toExponential(2);
  }
  return String(Number(value.toPrecision(4)));
}

/** Slider position (0..1) to value, honoring log parameters. */
function sliderToValue(param: PlaygroundParam, fraction: number): number {
  if (param.log) {
    const value = param.min * (param.max / param.min) ** fraction;
    // Snap to the step grid when one is given, so log sliders land on
    // sensible component values (100, 110, …, 10k).
    if (param.step !== undefined) {
      return Math.max(param.min, Math.round(value / param.step) * param.step);
    }
    return value;
  }
  return param.min + fraction * (param.max - param.min);
}

function valueToSlider(param: PlaygroundParam, value: number): number {
  if (param.log) {
    return Math.log(value / param.min) / Math.log(param.max / param.min);
  }
  return (value - param.min) / (param.max - param.min);
}

export default function Playground({ spec }: { spec: PlaygroundSpec }) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(spec.params.map((param) => [param.name, param.default])),
  );
  const [mathjs, setMathjs] = useState<MathJs | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(plotRef);

  useEffect(() => {
    let alive = true;
    void import("mathjs").then((module) => {
      if (alive) setMathjs(module);
    });
    return () => {
      alive = false;
    };
  }, []);

  const scope = useMemo(() => ({ ...values }), [values]);

  const outputs = useMemo(() => {
    if (mathjs === null) return [];
    return spec.outputs.map((output) => ({
      ...output,
      value: mathjs.evaluate(output.formula, scope) as number,
    }));
  }, [mathjs, scope, spec.outputs]);

  useEffect(() => {
    if (mathjs === null || width === null) return;
    const container = plotRef.current;
    if (container === null) return;

    const { x, y } = spec.plot;
    const points: Array<[number, number]> = [];
    for (let i = 0; i < x.samples; i++) {
      const t = i / (x.samples - 1);
      const xv = x.log
        ? 10 **
          (Math.log10(x.min) + t * (Math.log10(x.max) - Math.log10(x.min)))
        : x.min + t * (x.max - x.min);
      const yv = mathjs.evaluate(y.formula, {
        ...scope,
        [x.variable]: xv,
      }) as number;
      points.push([xv, yv]);
    }

    const markers = spec.plot.markers.map((marker) => ({
      x: mathjs.evaluate(marker.xFormula, scope) as number,
      y: marker.y,
      label: marker.label,
    }));

    container.replaceChildren(
      renderLinePlot({
        x: { label: x.label, unit: x.unit, scale: x.log ? "log" : "linear" },
        y: { label: y.label, unit: y.unit },
        series: [{ points }],
        yDomain: domainIncludingZero(points.map(([, yv]) => yv)),
        markers,
        width,
      }),
    );
  }, [mathjs, scope, spec.plot, width]);

  return (
    <div className="border-border bg-card my-6 flex flex-col gap-4 rounded-lg border p-5">
      {spec.title && (
        <p className="text-foreground text-sm font-medium">{spec.title}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {spec.params.map((param) => {
          const label =
            param.symbol && param.symbol !== param.name
              ? `${param.symbol} — ${param.name}`
              : param.name;
          return (
            <label key={param.name} className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground flex justify-between">
                <span>
                  {label}
                  {param.unit ? ` (${param.unit})` : ""}
                </span>
                <span className="text-foreground tabular-nums">
                  {formatNumber(values[param.name] ?? param.default)}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={valueToSlider(
                  param,
                  values[param.name] ?? param.default,
                )}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    [param.name]: sliderToValue(
                      param,
                      Number(event.target.value),
                    ),
                  }))
                }
              />
            </label>
          );
        })}
      </div>

      {outputs.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {outputs.map((output) => (
            <p key={output.name} className="text-muted-foreground text-sm">
              {output.name}:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {formatNumber(output.value)}
                {output.unit ? ` ${output.unit}` : ""}
              </span>
            </p>
          ))}
        </div>
      )}

      <div ref={plotRef} className="text-foreground w-full" />
    </div>
  );
}
