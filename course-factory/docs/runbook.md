# Runbook: one lesson by hand

How to run a single lesson through the pipeline without the Director skill. Written during sprint 1, tested on `work/analog-electronics/1-common-emitter-amplifier`, updated for the lesson and part structure. All commands run from `course-factory/` unless noted. `FRONTEND_DIR` is the repository root, one level up.

A lesson is a chapter of 20 to 40 minutes, made of parts. A part is one study page, one concept, at most 10 minutes, question-style title preferred. The build rejects a part above 10 minutes and a lesson folder without `lesson.json`.

## Setup (once per machine)

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The deterministic gates need less than the full requirements: `numpy` and `jsonschema` cover `run_claims.py`, and `style_lint.py` and `svg_normalize.py` need only the standard library. Without `jsonschema` the claims schema check degrades to a warning, so install it before you trust a green run.

Tesseract (OCR) and ngspice (circuit simulation) are only needed from sprint 3 onward.

## 1. Outline

Create `work/<course-slug>/outline.json` by hand or with the outliner agent. It holds the `course` object (title, summary, category, subCategory, difficulty) and a list of lessons. Each lesson carries its slug, order, title, summary, estimated minutes (20 to 40) and a list of parts (slug, order, title, summary, minutes, objectives, prerequisites as part ids, planned practice). The Integrator later writes `course.json` and copies `lesson.json` from it.

## 2. Writer

Spawn the writer agent with its definition (`.claude/agents/writer.md`), the lesson folder and the outline path. It creates in `work/<course-slug>/<lesson-slug>/`:

- `lesson.json` (title, order, summary)
- one folder per part, `<p>-<part-slug>/doc.mdx`, with the part frontmatter
- `claims.json` and `citations.json` at the lesson level
- `figures.md` with briefs (figures live inside the part folders that use them)

Constraints the Director passes per run: whether external figure files are produced (if not, parts may not reference `./fig-*.svg` or data JSON files), whether `needsReview` must be true, and which python runs the tools.

## 3. Gates (deterministic)

```
python tools/run_claims.py work/<course>/<lesson>
python tools/style_lint.py work/<course>/<lesson>
```

Both must exit 0. `run_claims.py` collects every `doc.mdx` under the lesson folder, so claim texts are matched across all parts. It writes `claims-report.json` at the lesson level (gitignored). Save a copy before the editor runs, so numbers can be compared after.

## 4. Editor

Spawn the editor agent (`.claude/agents/editor.md`). It fixes style problems and improves readability across the parts, then writes `review-edit.md`. Afterwards rerun both gates and compare `claims-report.json` with the saved copy. If any number changed, revert the edit.

## 5. Integrator

The integrator agent (`.claude/agents/integrator.md`) checks the gates again, creates `$FRONTEND_DIR/src/docs/courses/<course>/course.json` if missing, copies `lesson.json` and every part folder into the frontend, and runs the frontend checks:

```
cd .. && pnpm lint && pnpm lint:content && pnpm typecheck && pnpm build
```

A lesson whose gates fail must not be copied. The refusal path is part of the contract, test it with a seeded failure when changing the integrator prompt.

## 6. Browser check and screenshot

Serve the build and look at each part page under `/courses/<course>/<lesson>/<part>/`: display math centered, diagrams rendered, quizzes give feedback for a correct and an incorrect answer, no console errors.

```
cd .. && pnpm preview --port 4321 &
pnpm exec playwright screenshot --full-page --wait-for-timeout=1500 \
  http://localhost:4321/courses/<course>/<lesson>/<part>/ \
  course-factory/work/<course>/<lesson>/screenshot.png
pnpm exec astro preview stop
```

The screenshot uses the frontend's npm Playwright, so no extra browser install is needed. Screenshots are gitignored.

Note for in-app browsers: `NumericQuiz` islands use `client:visible`. In some embedded browser panes the intersection event never fires after a reload, so the Check button looks dead. Verify such quizzes in a normal browser tab before blaming the lesson.

## 7. Commit

Two commits per lesson, both from the repository root:

```
feat(content): add <lesson title> parts
```

for the inserted lesson plus its `work/` artifacts, and prompt or tool fixes separately. Content insertion is exempt from the size limit. Update the sprint file and its verification log in the same sprint.
