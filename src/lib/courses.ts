import { getCollection, type CollectionEntry } from "astro:content";

export type Lesson = CollectionEntry<"lessons">;

export interface Course {
  slug: string;
  title: string;
  lessons: Lesson[];
}

/** "dc-circuits" -> "DC Circuits" (DC/AC kept uppercase for an EE audience). */
export function courseTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) =>
      /^(dc|ac)$/.test(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export function lessonHref(lesson: Lesson): string {
  const [course, ...rest] = lesson.id.split("/");
  return `/courses/${course}/${rest.join("/")}/`;
}

export function sortByOrder(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => a.data.order - b.data.order);
}

export async function getCourses(): Promise<Course[]> {
  const lessons = await getCollection("lessons");
  const byCourse = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const slug = lesson.id.split("/")[0];
    byCourse.set(slug, [...(byCourse.get(slug) ?? []), lesson]);
  }
  return [...byCourse.entries()]
    .map(([slug, list]) => ({
      slug,
      title: courseTitle(slug),
      lessons: sortByOrder(list),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
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
