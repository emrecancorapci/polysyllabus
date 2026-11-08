import { getCollection, type CollectionEntry } from "astro:content";

export type Lesson = CollectionEntry<"lessons">;
export type CourseMeta = CollectionEntry<"courses">;

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Course {
  slug: string;
  title: string;
  summary?: string;
  category: string;
  subCategory: string;
  difficulty: Difficulty;
  lessons: Lesson[];
}

export function lessonHref(lesson: Lesson): string {
  const [course, ...rest] = lesson.id.split("/");
  return `/courses/${course}/${rest.join("/")}/`;
}

export function sortByOrder(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => a.data.order - b.data.order);
}

export async function getCourses(): Promise<Course[]> {
  const [lessons, metadata] = await Promise.all([
    getCollection("lessons"),
    getCollection("courses"),
  ]);

  const metadataBySlug = new Map(metadata.map((entry) => [entry.id, entry]));
  const lessonsByCourse = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const slug = lesson.id.split("/")[0];
    lessonsByCourse.set(slug, [...(lessonsByCourse.get(slug) ?? []), lesson]);
  }

  const courses: Course[] = [];
  for (const [slug, courseLessons] of lessonsByCourse) {
    const meta = metadataBySlug.get(slug);
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
      lessons: sortByOrder(courseLessons),
    });
  }

  return courses.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.subCategory.localeCompare(b.subCategory) ||
      a.title.localeCompare(b.title),
  );
}

export async function getCourse(slug: string): Promise<Course | undefined> {
  return (await getCourses()).find((course) => course.slug === slug);
}

export function getPrevNext(
  lessons: Lesson[],
  id: string,
): { prev?: Lesson; next?: Lesson } {
  const sorted = sortByOrder(lessons);
  const index = sorted.findIndex((lesson) => lesson.id === id);
  return {
    prev: index > 0 ? sorted[index - 1] : undefined,
    next:
      index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined,
  };
}

/** Resolve prerequisite lesson ids to titles; unknown ids pass through as-is. */
export function prerequisiteLabel(id: string, lessons: Lesson[]): string {
  return lessons.find((lesson) => lesson.id === id)?.data.title ?? id;
}
