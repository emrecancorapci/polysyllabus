import { getCollection, type CollectionEntry } from "astro:content";

export type Part = CollectionEntry<"parts">;
export type CourseMeta = CollectionEntry<"courses">;

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Lesson {
  /** Course slug, e.g. "dc-circuits". */
  courseSlug: string;
  /** Lesson folder slug, e.g. "1-ohms-law". */
  slug: string;
  /** `<course-slug>/<lesson-slug>`. */
  id: string;
  title: string;
  summary?: string;
  order: number;
  parts: Part[];
}

export interface Course {
  slug: string;
  title: string;
  summary?: string;
  category: string;
  subCategory: string;
  difficulty: Difficulty;
  lessons: Lesson[];
}

/** All parts of a course in study order (lesson order, then part order). */
export function flattenParts(course: Course): Part[] {
  return course.lessons.flatMap((lesson) => lesson.parts);
}

export function partHref(part: Part): string {
  return `/courses/${part.id}/`;
}

export function lessonFirstPartHref(lesson: Lesson): string | undefined {
  return lesson.parts[0] ? partHref(lesson.parts[0]) : undefined;
}

export function totalMinutes(parts: Part[]): number {
  return parts.reduce((total, part) => total + part.data.estimatedTime, 0);
}

export async function getCourses(): Promise<Course[]> {
  const [parts, courseMeta, lessonMeta] = await Promise.all([
    getCollection("parts"),
    getCollection("courses"),
    getCollection("lessons"),
  ]);

  const courseMetaBySlug = new Map(
    courseMeta.map((entry) => [entry.id, entry]),
  );
  const lessonMetaById = new Map(lessonMeta.map((entry) => [entry.id, entry]));

  // courseSlug / lessonSlug -> parts
  const partsByLesson = new Map<string, Part[]>();
  for (const part of parts) {
    const [courseSlug, lessonSlug] = part.id.split("/");
    const key = `${courseSlug}/${lessonSlug}`;
    partsByLesson.set(key, [...(partsByLesson.get(key) ?? []), part]);
  }

  const lessonsByCourse = new Map<string, Lesson[]>();
  for (const [id, lessonParts] of partsByLesson) {
    const [courseSlug, lessonSlug] = id.split("/");
    const meta = lessonMetaById.get(id);
    if (meta === undefined) {
      throw new Error(
        `[courses] missing lesson metadata: create src/docs/courses/${courseSlug}/${lessonSlug}/lesson.json with title and order`,
      );
    }
    lessonsByCourse.set(courseSlug, [
      ...(lessonsByCourse.get(courseSlug) ?? []),
      {
        courseSlug,
        slug: lessonSlug,
        id,
        title: meta.data.title,
        summary: meta.data.summary,
        order: meta.data.order,
        parts: [...lessonParts].sort((a, b) => a.data.order - b.data.order),
      },
    ]);
  }

  const courses: Course[] = [];
  for (const [slug, lessons] of lessonsByCourse) {
    const meta = courseMetaBySlug.get(slug);
    if (meta === undefined) {
      throw new Error(
        `[courses] missing course metadata: create src/docs/courses/${slug}/course.json with title, category, subCategory, and difficulty`,
      );
    }
    courses.push({
      slug,
      title: meta.data.title,
      summary: meta.data.summary,
      category: meta.data.category,
      subCategory: meta.data.subCategory,
      difficulty: meta.data.difficulty,
      lessons: lessons.sort((a, b) => a.order - b.order),
    });
  }

  return courses.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.subCategory.localeCompare(b.subCategory) ||
      a.title.localeCompare(b.title),
  );
}

export function getPrevNext(
  parts: Part[],
  id: string,
): { prev?: Part; next?: Part } {
  const index = parts.findIndex((part) => part.id === id);
  return {
    prev: index > 0 ? parts[index - 1] : undefined,
    next: index >= 0 && index < parts.length - 1 ? parts[index + 1] : undefined,
  };
}

/** Resolve prerequisite part ids to titles; unknown ids pass through as-is. */
export function prerequisiteLabel(id: string, parts: Part[]): string {
  return parts.find((part) => part.id === id)?.data.title ?? id;
}
