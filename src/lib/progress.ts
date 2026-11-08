export interface QuizResult {
  selected: number;
  correct: boolean;
  answeredAt: string;
}

export interface ProgressData {
  completed: string[];
  quiz: Record<string, QuizResult>;
}

// Keys keep the legacy "study-helper:" prefix from before the PolySyllabus
// rename so stored progress and theme preferences survive the rebrand.
export const PROGRESS_EVENT = "study-helper:progress";

const STORAGE_KEY = "study-helper:progress:v1";

const EMPTY: ProgressData = { completed: [], quiz: {} };

function isProgressData(value: unknown): value is ProgressData {
  if (typeof value !== "object" || value === null) return false;
  const { completed, quiz } = value as Record<string, unknown>;
  if (
    !Array.isArray(completed) ||
    completed.some((id) => typeof id !== "string")
  ) {
    return false;
  }
  if (typeof quiz !== "object" || quiz === null) return false;
  return Object.values(quiz).every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as QuizResult).selected === "number" &&
      typeof (entry as QuizResult).correct === "boolean" &&
      typeof (entry as QuizResult).answeredAt === "string",
  );
}

export function loadProgress(): ProgressData {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return isProgressData(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(data: ProgressData): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

export function isCompleted(data: ProgressData, lessonId: string): boolean {
  return data.completed.includes(lessonId);
}

/** Returns the new completion state. */
export function setLessonCompleted(
  lessonId: string,
  completed: boolean,
): boolean {
  const data = loadProgress();
  if (completed && !data.completed.includes(lessonId)) {
    save({ ...data, completed: [...data.completed, lessonId] });
  } else if (!completed && data.completed.includes(lessonId)) {
    save({
      ...data,
      completed: data.completed.filter((id) => id !== lessonId),
    });
  }
  return completed;
}

export function getQuizResult(
  data: ProgressData,
  lessonId: string,
): QuizResult | undefined {
  return data.quiz[lessonId];
}

export function recordQuizResult(
  lessonId: string,
  selected: number,
  correct: boolean,
): void {
  const data = loadProgress();
  save({
    ...data,
    quiz: {
      ...data.quiz,
      [lessonId]: { selected, correct, answeredAt: new Date().toISOString() },
    },
  });
}
