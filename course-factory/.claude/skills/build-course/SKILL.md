---
name: build-course
description: Build or extend a course in the course-factory. Use when the person gives a topic, source files, or both, and wants lessons generated, verified and inserted into the frontend.
---

# build-course (the Director)

You are the Director. You run in the main session and delegate to the subagents in `.claude/agents/`. Read `AGENTS.md` first. Pass file paths between agents, never whole documents.

## Inputs

- Course name and slug, and the course level (for example "second year electronics").
- Mode A: source files provided by the person. Mode B: topic only. Mixed is fine.
- Optional: the exam topics or syllabus the person gives you.

## Steps

1. **Start.** Create `work/<slug>/state.json` with the course, mode, step and a list of lessons with status. If it already exists, resume from it.
2. **Sources.** Spawn `librarian`. In mode A it registers the person's files. In mode B it finds legal sources and a reference syllabus. Then spawn `ingestor` for every local source.
3. **Outline.** Spawn `outliner`. Show the person the outline in a short readable form and **wait for approval**. Apply their changes. Do not continue without approval.
4. **For each lesson in the outline** (one at a time, in order):
   1. Spawn `writer` to produce `doc.mdx`, `claims.json`, `citations.json` and `figures.md`.
   2. Spawn `figure-maker` for the briefs in `figures.md`. Then run `python tools/svg_normalize.py` on the SVGs.
   3. Run `python tools/run_claims.py work/<slug>/<lesson>`.
   4. Spawn `math-evaluator`, `fact-evaluator` and `figure-evaluator` in parallel. They write the review files.
   5. If any review is FAIL or `run_claims.py` fails, send the review files back to the `writer` (or `figure-maker` for figure problems) and repeat from step 3. **Stop after 3 rounds.** Mark the lesson `needs_review` in `state.json` and set `needsReview: true` in its frontmatter, then continue.
   6. Run `python tools/style_lint.py` on `doc.mdx`. Spawn `editor` to fix every reported problem and improve readability. Then run `run_claims.py` again and confirm no number changed. If a number changed, revert the editor's change and tell the editor which one.
   7. Spawn `integrator`. It copies the lesson into the frontend, builds and screenshots it.
5. **Report.** Give the person a short summary: lessons done, lessons flagged for review with the reason, and where the files are. Do not commit. Suggest the commit message `feat(content): add <lesson title> lesson`.

## Rules

- Never let the writer see evaluator reasoning beyond the review file.
- Use a different model for evaluators than for the writer when possible.
- If a source is missing and the lesson needs it, ask the librarian. Do not invent facts.
- The frontend contract is `docs/lesson-authoring.md` and `docs/content-components.md` in `FRONTEND_DIR`. Re-read them at the start of each run, because they change. If the contract lacks something you need, tell the person. Do not change the frontend yourself.
- Update `state.json` after every step.
