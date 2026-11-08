import { z } from "zod";

export const axisSchema = z.object({
  label: z.string(),
  unit: z.string().optional(),
  scale: z.enum(["linear", "log"]).default("linear"),
});

export const seriesSchema = z.object({
  name: z.string().optional(),
  points: z
    .array(z.tuple([z.number(), z.number()]))
    .min(1, "each series needs at least one [x, y] point"),
});

export const plotDataSchema = z.object({
  type: z.literal("plot").default("plot"),
  title: z.string(),
  x: axisSchema,
  y: axisSchema,
  series: z.array(seriesSchema).min(1),
});

export const bodeDataSchema = z.object({
  type: z.literal("bode"),
  title: z.string(),
  frequency: z.object({
    label: z.string().default("Frequency"),
    unit: z.string().default("Hz"),
  }),
  /** Cutoff frequency for the −3 dB marker on the magnitude panel. */
  cutoff: z.number().positive().optional(),
  /** Points are [frequency Hz, magnitude dB]. */
  magnitude: seriesSchema,
  /** Points are [frequency Hz, phase degrees]. */
  phase: seriesSchema,
});

export const dataPlotSchema = z.discriminatedUnion("type", [
  plotDataSchema,
  bodeDataSchema,
]);

export type Axis = z.infer<typeof axisSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type PlotData = z.infer<typeof plotDataSchema>;
export type BodeData = z.infer<typeof bodeDataSchema>;

export function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}
