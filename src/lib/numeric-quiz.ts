import { z } from "zod";

export const numericQuizPropsSchema = z.object({
  question: z.string().min(1),
  answer: z.number().finite(),
  unit: z.string().optional(),
  /** Correct when |input - answer| <= abs + rel * |answer| (provide either). */
  tolerance: z
    .object({
      abs: z.number().positive().optional(),
      rel: z.number().positive().optional(),
    })
    .refine(
      (tolerance) => tolerance.abs !== undefined || tolerance.rel !== undefined,
      { message: "tolerance needs abs, rel, or both" },
    ),
  explanation: z.string(),
  /** Disambiguates the stored result when a lesson has several quizzes. */
  quizId: z.string().optional(),
});

export type NumericQuizProps = z.infer<typeof numericQuizPropsSchema>;

const SUFFIXES: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  m: 1e-3,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
};

/**
 * Accepts plain numbers (4700), scientific notation (4.7e3), SI suffixes
 * (4.7k, 41.7m), and resistor-style notation (4k7). Returns null when the
 * input is not a recognized engineering value.
 */
export function parseEngineering(input: string): number | null {
  const text = input.trim().replace(/,/g, ".").replace(/\s+/g, "");
  const match = /^(-?\d*\.?\d+)(?:[eE]([+-]?\d+))?([pnuµmkKMGT]?)(\d+)?$/.exec(
    text,
  );
  if (match === null) return null;

  const [, numberText, exponent, suffix, tail] = match;
  let value = Number(numberText);
  if (exponent !== undefined) value *= 10 ** Number(exponent);

  if (suffix !== undefined && suffix !== "") {
    const factor = SUFFIXES[suffix];
    if (factor === undefined) return null;
    value =
      tail !== undefined && tail !== ""
        ? Number(`${numberText}.${tail}`) * factor
        : value * factor;
  }

  return Number.isFinite(value) ? value : null;
}

export function withinTolerance(
  value: number,
  answer: number,
  tolerance: { abs?: number; rel?: number },
): boolean {
  const allowed =
    (tolerance.abs ?? 0) + (tolerance.rel ?? 0) * Math.abs(answer);
  return Math.abs(value - answer) <= allowed;
}
