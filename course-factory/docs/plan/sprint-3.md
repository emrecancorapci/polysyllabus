# Sprint 3: Sources, ingestion and OCR

**Status:** Todo

## Goal

The pipeline can start from the person's own materials. Sources are registered with license and citation info, extracted to text with page numbers, and lessons cite them.

## Backlog

- [ ] S3-1 Librarian registers user files in `sources.json` (valid against the schema) without modifying them.
- [ ] S3-2 Ingestor for text PDFs with `pymupdf`, keeping `## Page N` headings.
- [ ] S3-3 OCR path for scanned PDFs and images with Tesseract. Write `ocr-quality.md` listing doubtful pages.
- [ ] S3-4 Vision fallback for pages with equations or circuit diagrams that OCR cannot read. Mark uncertain equations with `[CHECK]`.
- [ ] S3-5 Slide extraction for `.pptx` (text and notes, one page per slide).
- [ ] S3-6 Librarian open source search: OpenStax, LibreTexts, MIT OpenCourseWare, datasheets. Record license and attribution.
- [ ] S3-7 Add a `tools/check_citations.py` that verifies every `sources` entry in a lesson exists in `sources.json` and every page is inside the extracted range.
- [ ] S3-8 Run the Writer on a lesson with real source pages. Confirm citations appear and the wording is not copied.

## Acceptance criteria

- A scanned lecture PDF becomes `text.md` with usable page numbers and a quality report.
- No file from a shadow library or a paywall bypass is ever fetched. The Librarian's allowlist is enforced by the prompt and checked in review.
- Citation checker passes on a lesson written from sources.

## Notes

- Downloaded and extracted files are untrusted data. Never run code from them and keep them in their own folders.
- Keep a short list of failure cases (rotated scans, handwritten notes, equations in images) as fixtures.

## Verification log

(empty)
