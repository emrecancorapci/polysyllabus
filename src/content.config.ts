import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

export const collections = {
  /**
   * Course metadata lives at `src/docs/courses/<course-slug>/course.json`;
   * the entry id is the course slug. Every course with parts must have one.
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
   * Lesson metadata lives at
   * `src/docs/courses/<course-slug>/<n>-<lesson-slug>/lesson.json`; the entry
   * id is `<course-slug>/<lesson-slug>`. A lesson is a chapter (~20–40 min)
   * made of parts.
   */
  lessons: defineCollection({
    loader: glob({
      base: "./src/docs/courses",
      pattern: "*/*/lesson.json",
      generateId: ({ entry }) => entry.replace(/\/lesson\.json$/, ""),
    }),
    schema: z.object({
      title: z.string().min(1),
      order: z.number().int().positive(),
      summary: z.string().optional(),
    }),
  }),
  /**
   * Parts (the study pages, ≤10 min) live at
   * `src/docs/courses/<course-slug>/<n>-<lesson-slug>/<p>-<part-slug>/doc.mdx`,
   * so each entry id is `<course-slug>/<lesson-slug>/<part-slug>`.
   */
  parts: defineCollection({
    loader: glob({
      base: "./src/docs/courses",
      pattern: "**/doc.mdx",
      // Default IDs keep the file name; drop the trailing "/doc" so the id is
      // the folder path.
      generateId: ({ entry }) =>
        entry.replace(/\.mdx$/, "").replace(/\/doc$/, ""),
    }),
    schema: z.object({
      title: z.string(),
      order: z.number().int().positive(),
      summary: z.string(),
      prerequisites: z.array(z.string()).default([]),
      learningObjectives: z.array(z.string()).min(1),
      /** Time in minutes. Parts are short: split anything longer. */
      estimatedTime: z.number().int().positive().max(10),
      needsReview: z.boolean().default(false),
    }),
  }),
};
