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
      /** BCP-47 language tag of the course content, e.g. "en" or "tr". */
      language: z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{1,8})*$/, {
        message: "Use a BCP-47 language tag, e.g. en or tr",
      }),
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
   * Parts (the study pages) live at
   * `src/docs/courses/<course-slug>/<n>-<lesson-slug>/<p>-<part-slug>/doc.mdx`,
   * so each entry id is `<course-slug>/<lesson-slug>/<part-slug>`.
   * Regular course parts are short (≤10 min); cheat sheets and question
   * sets may run longer.
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
    schema: z
      .object({
        title: z.string(),
        order: z.number().int().positive(),
        summary: z.string(),
        prerequisites: z.array(z.string()).default([]),
        learningObjectives: z.array(z.string()).min(1),
        /**
         * Kind of study page. `course` parts teach one concept and are
         * capped at 10 minutes; `cheat-sheet` parts are long-form reference
         * material; `questions` parts are practice/exam question sets.
         */
        type: z.enum(["course", "cheat-sheet", "questions"]).default("course"),
        /** Time in minutes. Course parts are short: split anything longer. */
        estimatedTime: z.number().int().positive(),
        needsReview: z.boolean().default(false),
      })
      .superRefine((data, ctx) => {
        if (data.type === "course" && data.estimatedTime > 10) {
          ctx.addIssue({
            code: "custom",
            input: data.estimatedTime,
            path: ["estimatedTime"],
            message: `Course parts take at most 10 minutes (got ${data.estimatedTime}); split the part, or set type to cheat-sheet or questions for long-form material.`,
          });
        }
      }),
  }),
};
