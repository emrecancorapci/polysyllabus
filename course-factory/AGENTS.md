# AGENTS.md (course-factory)

Guidance for AI agents and humans working on the **generation pipeline**. The frontend has its own `AGENTS.md`. This folder produces course lessons as MDX files and inserts them into the frontend's content collection.

## Purpose

Turn a topic, a set of source files, or both into well structured, verified course material for electrical and electronics engineering. Correctness matters more than speed, because the person will study for exams from the output. A course is made of lessons of 20 to 40 minutes, and every lesson is split into parts of at most 10 minutes.

## Layout

```
/course-factory
  AGENTS.md
  requirements.txt
  /.claude
    /agents            one markdown file per subagent
    /skills/build-course/SKILL.md   the Director (runs in the main session)
  /schemas             claims.schema.json, sources.schema.json
  /tools               run_claims.py, style_lint.py, svg_normalize.py
  /docs/plan           sprint plans
  /examples/sample-course   a tiny course (course.json and one lesson) that passes every tool
  /work/<course-slug>
    state.json         pipeline state, so any run can resume
    sources/           downloaded files and sources.json
    extracted/         text, figures and OCR output per source
    outline.json       approved outline
    /<lesson-slug>
      lesson.json      lesson title, order and summary
      /<p>-<part-slug>
        doc.mdx        one part, at most 10 minutes
        fig-*.svg      figures for this part
        *.json         plot data for this part
      claims.json      executable claims for every part of the lesson
      citations.json     source id and pages per section (the frontend has no sources field)
      figures.md       figure briefs written by the writer
      review-math.md
      review-facts.md
      review-figures.md
      review-edit.md
```

The frontend is the repository root, one level up. Its location is read from `FRONTEND_DIR` (default `..`). The contract for lessons is `docs/lesson-authoring.md` (structure, frontmatter, math and figure rules, failure modes) and `docs/content-components.md` (allowed MDX components and props), both under `FRONTEND_DIR`. Read both before writing a lesson. They change over time, so do not copy their rules into prompts. Point to them.

Golden rule from the frontend: content never contains imports, chart code or JavaScript. Every course needs a `course.json` (title, summary, category, subCategory, difficulty) or the build fails. Lesson folder names are permanent ids.

## Pipeline

1. Librarian collects sources. Ingestor extracts them.
2. Outliner proposes `outline.json`. **The person approves it** before any lesson is written.
3. Per lesson: Writer, Figure maker, then the three evaluators, then Editor, then Integrator.
4. Evaluator failures go back to the Writer or Figure maker with the review file. Maximum **3 rounds**. After that the lesson is marked as needing review and the person is told.

The Director is a skill, not a subagent, because subagents cannot spawn other subagents. The main session runs `/build-course` and delegates to the subagents in `.claude/agents/`.

## Hard rules

1. **Nobody checks their own work.** Evaluators never edit lessons. They only write review files. The Writer never evaluates.
2. **Numbers must be executable.** Every computed number, equation result and quiz answer in a lesson has an entry in `claims.json` with a Python snippet. `tools/run_claims.py` runs them.
3. **Quiz answers are recomputed blind.** The Math evaluator recomputes quiz answers from the question text without reading the Writer's snippet.
4. **Legal sources only.** The person's own files, open textbooks (OpenStax, LibreTexts), MIT OpenCourseWare, manufacturer datasheets and application notes, arXiv, Wikimedia Commons, and library access the person has. Never shadow libraries (Libgen, Z-Library, Sci-Hub, Anna's Archive) and never paywall bypasses.
5. **Learn from sources, do not copy them.** Rewrite every section in new words and cite the source id and page. Do not copy passages. Redraw figures instead of reusing a book's image. Reuse an image only if its license allows it, and record the attribution.
6. **Code is the source of truth for figures and plots.** Circuits come from Schemdraw (or CircuiTikZ), plots from matplotlib or scipy, diagrams from Mermaid. Do not produce raster images of circuits.
7. **State lives in files.** Update `state.json` after every step so a run can resume.
8. **Bounded loops.** Never run more than 3 revision rounds for one lesson.

## Writing style rules (enforced by `tools/style_lint.py`)

- No em dashes, no en dashes used as punctuation, no semicolons. Use periods and commas.
- Sentences are at most 25 words.
- Short paragraphs. One idea per paragraph.
- Plain words. Define each term the first time it appears.
- The linter also enforces frontend rules: fenced display math, no math in title or summary, no Unicode dashes or braces inside `<Mermaid>`.
- Keep the same symbols as the figures (`V_in`, `V_out`, `R`, `C`).

## Quality gates per lesson

- `run_claims.py` passes with no failures.
- Math, fact and figure reviews all say PASS.
- `style_lint.py` reports 0 problems.
- Frontend `pnpm lint`, `pnpm typecheck` and `pnpm build` pass, and the screenshot has no console errors.

## Tools

All tools are plain Python, need no network and no LLM, and return exit code 0 on success and 1 on problems.

```
python tools/run_claims.py work/<course>/<lesson>        # run claims.json, writes claims-report.json
python tools/style_lint.py work/<course>/<lesson>        # style rules, add --errors-only to ignore warnings
python tools/svg_normalize.py work/<course>/<lesson>     # theme friendly SVG, add --check to only test
```

Try them on `examples/sample-course/1-rc-low-pass-filter` first. Claim snippets run with restricted builtins and imports and a 10 second limit. This is a guard rail, not a security sandbox.

## Setup

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Tesseract (OCR) and ngspice (circuit simulation) are system packages. Install them with your package manager.

## Commits

Same rules as the frontend: atomic commits, about 400 lines at most, except scaffolding, package installation and content insertion. Use imperative Conventional Commits, for example `feat(content): add series-parallel resistors lesson`.
