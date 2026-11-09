# Sprint 5: Fact checking, outlines and the Director

**Status:** Todo

## Goal

A whole course can be built end to end from a topic or from sources, with an outline approval step, fact checking, resumable state and a clear report of what needs the person's attention.

## Backlog

- [ ] S5-1 Fact evaluator: claim extraction, support check against cited pages, web fallback, terminology check, and the copy check against source text.
- [ ] S5-2 Add a `tools/copy_check.py` that measures long word overlap between a lesson and its source pages, so copying is detected by code and not by opinion.
- [ ] S5-3 Outliner for source mode (follow the person's materials) and topic mode (reference syllabus or textbook table of contents).
- [ ] S5-4 Outline approval step in the Director skill. No lesson is written before approval.
- [ ] S5-5 `state.json` and resume: stop a run in the middle and continue it.
- [ ] S5-6 `needs_review` flow: lessons that fail after 3 rounds are inserted with the flag and listed in the final report.
- [ ] S5-7 Final report: lessons done, lessons flagged and why, time and cost estimates, where the files are.
- [ ] S5-8 Run a full small course (3 to 5 lessons) in source mode and another in topic mode. Record problems and fix prompts.

## Acceptance criteria

- A 3 lesson course is produced in each mode with no manual edits to the MDX.
- Killing the run and restarting it continues without redoing finished lessons.
- Every lesson in the frontend has passed all gates or carries `needs_review`.

## Notes

- Costs grow with the number of lessons and revision rounds. Log token use per agent so expensive steps are visible.
- Use the cheapest model that passes the mutation tests for each role. Keep the evaluators on a different model from the Writer.

## Verification log

(empty)
