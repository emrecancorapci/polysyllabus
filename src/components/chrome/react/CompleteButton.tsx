import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isCompleted, loadProgress, setLessonCompleted } from "@/lib/progress";

interface Props {
  lessonId: string;
}

export default function CompleteButton({ lessonId }: Props) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isCompleted(loadProgress(), lessonId));
  }, [lessonId]);

  return (
    <Button
      variant={completed ? "secondary" : "default"}
      size="sm"
      onClick={() => setCompleted(setLessonCompleted(lessonId, !completed))}
    >
      {completed && <Check data-icon="inline-start" />}
      {completed ? "Completed" : "Mark as complete"}
    </Button>
  );
}
