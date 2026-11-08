import { create, all } from "mathjs";
import { z } from "zod";

const math = create(all, {});

export const playgroundParamSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().optional(),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  default: z.number(),
  unit: z.string().optional(),
});

export const playgroundOutputSchema = z.object({
  name: z.string().min(1),
  formula: z.string().min(1),
  unit: z.string().optional(),
});

export const playgroundPlotSchema = z.object({
  x: z.object({
    /** Variable name the y-formula uses for the swept axis (e.g. "f"). */
    variable: z.string().min(1),
    label: z.string(),
    unit: z.string().optional(),
    min: z.number(),
    max: z.number(),
    log: z.boolean().default(false),
    samples: z.number().int().positive().max(2000).default(200),
  }),
  y: z.object({
    formula: z.string().min(1),
    label: z.string(),
    unit: z.string().optional(),
  }),
});

export const playgroundSpecSchema = z
  .object({
    title: z.string().optional(),
    params: z.array(playgroundParamSchema).min(1),
    outputs: z.array(playgroundOutputSchema).default([]),
    plot: playgroundPlotSchema,
  })
  .superRefine((spec, ctx) => {
    const names = new Set<string>();
    for (const param of spec.params) {
      if (names.has(param.name)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate parameter name "${param.name}"`,
        });
      }
      names.add(param.name);
      if (param.min >= param.max) {
        ctx.addIssue({
          code: "custom",
          message: `parameter "${param.name}": min must be below max`,
        });
      }
      if (param.default < param.min || param.default > param.max) {
        ctx.addIssue({
          code: "custom",
          message: `parameter "${param.name}": default is outside [min, max]`,
        });
      }
    }
    if (spec.plot.x.min >= spec.plot.x.max) {
      ctx.addIssue({
        code: "custom",
        message: "plot.x: min must be below max",
      });
    }
  });

export type PlaygroundParam = z.infer<typeof playgroundParamSchema>;
export type PlaygroundOutput = z.infer<typeof playgroundOutputSchema>;
export type PlaygroundSpec = z.infer<typeof playgroundSpecSchema>;

/**
 * Parses every formula and evaluates it once with the default parameters, so
 * syntax errors and unknown symbols fail `astro build` instead of producing
 * a broken widget. mathjs is an interpreter — no eval/Function is involved.
 */
export function validateFormulas(spec: PlaygroundSpec): void {
  const scope: Record<string, number> = {};
  for (const param of spec.params) {
    scope[param.name] = param.default;
  }

  const formulas = [...spec.outputs.map((output) => output.formula)];
  for (const source of formulas) {
    let value: unknown;
    try {
      value = math
        .parse(source)
        .compile()
        .evaluate({ ...scope });
    } catch (error) {
      throw new Error(
        `[Playground] formula fails to parse or evaluate with default parameters: "${source}" (${error instanceof Error ? error.message : String(error)})`,
        { cause: error },
      );
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(
        `[Playground] formula does not produce a finite number (unknown symbol?): "${source}"`,
      );
    }
  }

  // The swept x variable must not shadow a slider parameter.
  if (scope[spec.plot.x.variable] !== undefined) {
    throw new Error(
      `[Playground] plot.x.variable "${spec.plot.x.variable}" must differ from parameter names`,
    );
  }

  // The plot formula sees the swept variable; validate at a sample point.
  const { x, y } = spec.plot;
  const sample = x.log ? Math.sqrt(x.min * x.max) : (x.min + x.max) / 2;
  try {
    const value: unknown = math.evaluate(y.formula, {
      ...scope,
      [x.variable]: sample,
    });
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("not a finite number");
    }
  } catch (error) {
    throw new Error(
      `[Playground] plot.y.formula fails at ${x.variable} = ${sample}: "${y.formula}" (${error instanceof Error ? error.message : String(error)})`,
      { cause: error },
    );
  }
}
