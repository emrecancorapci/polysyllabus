import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

export const collections = {
  /**
   * Course metadata lives at `src/docs/courses/<course-slug>/course.json`;
   * the entry id is the course slug. Every course with lessons must have one.
   */
  courses: defineCollection({
    loader: glob({
      base: "./src/docs/courses",
      pattern: "*/course.json",
      generateId: ({ entry }) => entry.replace(/\/course\.json$/, ""),
    }),
    schema: z.object({
      title: z.string().min(1),
      summary: z.string().optional(),
      category: z.string().min(1),
      subCategory: z.string().min(1),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    }),
  }),
  /**
   * Lessons live at `src/docs/courses/<course-slug>/<n>-<module-slug>/doc.mdx`,
   * so each entry id is `<course-slug>/<n>-<module-slug>`.
   */
  lessons: defineCollection({
    loader: glob({
      base: "./src/docs/courses",
      pattern: "**/doc.mdx",
      // Default IDs keep the file name; drop the trailing "/doc" so the id is
      // just "<course-slug>/<n>-<module-slug>".
      generateId: ({ entry }) =>
        entry.replace(/\.mdx$/, "").replace(/\/doc$/, ""),
    }),
    schema: z.object({
      title: z.string(),
      order: z.number().int().positive(),
      summary: z.string(),
      prerequisites: z.array(z.string()).default([]),
      learningObjectives: z.array(z.string()).min(1),
      /** Time in minutes. */
      estimatedTime: z.number().int().positive(),
      needsReview: z.boolean().default(false),
    }),
  }),
};
