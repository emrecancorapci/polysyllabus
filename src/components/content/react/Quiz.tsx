import { cn } from "cn";
import { useEffect, useState } from "react";
import { getQuizResult, loadProgress, recordQuizResult } from "@/lib/progress";

export interface QuizProps {
  question: string;
  options: string[];
  /** Index of the correct option in `options`. */
  answer: number;
  /** Shown after answering, regardless of correctness. */
  explanation: string;
  /** Lesson id (from the page URL); empty disables progress recording. */
  lessonId?: string;
}

export default function Quiz({
  question,
  options,
  answer,
  explanation,
  lessonId,
}: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === answer;

  useEffect(() => {
    if (!lessonId) return;
    const stored = getQuizResult(loadProgress(), lessonId);
    if (stored) setSelected(stored.selected);
  }, [lessonId]);

  function choose(index: number): void {
    setSelected(index);
    if (lessonId) recordQuizResult(lessonId, index, index === answer);
  }

  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-lg border p-5">
      <p className="font-medium">{question}</p>
      <fieldset
        aria-label="Answer options"
        className="flex flex-col gap-2 border-0 p-0"
      >
        {options.map((option, index) => {
          const isAnswer = index === answer;
          const isSelected = index === selected;
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => choose(index)}
              className={cn(
                "border-border rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                !answered &&
                  "hover:border-primary/60 hover:bg-muted/50 cursor-pointer",
                answered &&
                  isAnswer &&
                  "border-primary bg-primary/10 font-medium",
                answered &&
                  isSelected &&
                  !isAnswer &&
                  "border-destructive bg-destructive/10 text-destructive",
                answered && !isAnswer && !isSelected && "opacity-60",
              )}
            >
              {option}
            </button>
          );
        })}
      </fieldset>
      {answered && (
        <p role="status" className="text-muted-foreground text-sm">
          <span
            className={
              correct
                ? "text-primary font-medium"
                : "text-destructive font-medium"
            }
          >
            {correct ? "Correct." : "Not quite."}
          </span>{" "}
          {explanation}
        </p>
      )}
    </div>
  );
}
