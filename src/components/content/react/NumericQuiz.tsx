import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useEffect, useState } from "react";
import { getQuizResult, loadProgress, recordQuizResult } from "@/lib/progress";
import type { NumericQuizProps } from "@/lib/numeric-quiz";
import { parseEngineering, withinTolerance } from "@/lib/numeric-quiz";
import MathText from "./MathText";

export default function NumericQuiz({
  question,
  answer,
  unit,
  tolerance,
  explanation,
  lessonId,
  quizId,
}: NumericQuizProps & { lessonId?: string }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    value: number;
    correct: boolean;
  } | null>(null);
  const storageKey = lessonId
    ? quizId
      ? `${lessonId}#${quizId}`
      : `${lessonId}#numeric`
    : null;

  useEffect(() => {
    if (storageKey === null) return;
    const stored = getQuizResult(loadProgress(), storageKey);
    if (stored && stored.selected >= 0) {
      // Restored answers keep the recorded verdict; the raw text is gone.
      setResult({ value: answer, correct: stored.correct });
    }
  }, [answer, storageKey]);

  function submit(): void {
    const parsed = parseEngineering(input);
    if (parsed === null || storageKey === null) return;
    const correct = withinTolerance(parsed, answer, tolerance);
    setResult({ value: parsed, correct });
    recordQuizResult(storageKey, -1, correct);
  }

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-5">
      <p className="font-medium">
        <MathText text={question} />
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 1.59k or 1591.5"
          value={input}
          disabled={result !== null}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && result === null) submit();
          }}
          aria-label="Numeric answer"
          className={cn(
            "border-border bg-background rounded-lg border px-3 py-2 text-sm",
            result !== null && "opacity-60",
          )}
        />
        {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
        {result === null ? (
          <Button
            size="sm"
            disabled={parseEngineering(input) === null}
            onClick={submit}
          >
            Check
          </Button>
        ) : (
          <span
            className={cn(
              "text-sm font-medium",
              result.correct ? "text-primary" : "text-destructive",
            )}
          >
            {result.correct
              ? "Correct."
              : `Not within tolerance — expected ≈ ${answer}${unit ? ` ${unit}` : ""}.`}
          </span>
        )}
      </div>
      {result !== null && (
        <p role="status" className="text-muted-foreground text-sm">
          <span
            className={
              result.correct
                ? "text-primary font-medium"
                : "text-destructive font-medium"
            }
          >
            {result.correct ? "Correct." : "Not quite."}
          </span>{" "}
          <MathText text={explanation} />
        </p>
      )}
    </div>
  );
}
