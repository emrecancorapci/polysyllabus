#!/usr/bin/env python3
"""Style and contract linter for lesson MDX files.

Usage:
    python tools/style_lint.py <doc.mdx | lesson-folder | folder> [...] [--errors-only] [--max-words N]

Style rules (see AGENTS.md):
    error    dash          em dash, en dash, double hyphen or spaced hyphen used as punctuation
    error    semicolon     any semicolon in prose
    error    sentence      a sentence longer than 25 words
    warning  paragraph     a paragraph with more than 6 sentences or 120 words
    warning  repeat        three sentences in a row that start with the same word

Frontend contract rules (see the frontend's docs/lesson-authoring.md):
    error    display-math  a single-line $$...$$ (it renders as small inline math, use fenced $$ lines)
    error    mermaid       an em or en dash, a brace or a bare <br> inside <Mermaid> children
    error    title-math    math in the title or summary frontmatter (not rendered)
    warning  backslash     a doubled backslash before a letter (write single backslashes)

Code blocks, inline code, math (KaTeX), imports, comments, URLs and JSX tag syntax are
ignored for the style rules. Prose inside component props (question, explanation, caption,
title, label, summary, options) and inside frontmatter values is checked. Formulas and
other props are ignored.

Exit code 0 means no problems. Exit code 1 means problems were found.
"""

from __future__ import annotations

import argparse
import bisect
import re
import sys
from dataclasses import dataclass
from pathlib import Path

EM_DASH = "—"
EN_DASH = "–"
DOT_LEADER = "․"  # stands in for decimal points so they do not end sentences

MAX_WORDS = 25
MAX_PARAGRAPH_SENTENCES = 6
MAX_PARAGRAPH_WORDS = 120

ABBREVIATIONS = ["e.g.", "i.e.", "etc.", "vs.", "Fig.", "Figs.", "approx.", "cf.", "No."]
ERROR_RULES = {"dash", "semicolon", "sentence", "display-math", "mermaid", "title-math"}

PROSE_KEYS = ("question", "explanation", "caption", "title", "label", "summary")
KEYED_PROSE = re.compile(r"\b(?:" + "|".join(PROSE_KEYS) + r")\s*[=:]\s*(?:\"((?:[^\"\\]|\\.)*)\"|'([^']*)')")
OPTIONS = re.compile(r"\boptions\s*=\s*\{\s*\[(.*?)\]\s*\}", re.S)
QUOTED = re.compile(r"\"((?:[^\"\\]|\\.)*)\"")


@dataclass
class Problem:
    path: Path
    line: int
    rule: str
    message: str

    @property
    def severity(self) -> str:
        return "error" if self.rule in ERROR_RULES else "warning"


def blank(match: re.Match) -> str:
    """Replace a match with the same number of newlines so line numbers stay right."""
    return "\n" * match.group(0).count("\n")


def split_frontmatter(lines: list[str]) -> tuple[list[str], int, list[str], int]:
    """Return (frontmatter lines, first frontmatter line number, body lines, first body line number)."""
    if lines and lines[0].strip() == "---":
        for index in range(1, len(lines)):
            if lines[index].strip() == "---":
                return lines[1:index], 2, lines[index + 1 :], index + 2
    return [], 0, lines, 1


def check_characters(line: str) -> list[tuple[str, str]]:
    """Return (rule, message) for dash and semicolon problems in one line of prose."""
    problems = []
    if EM_DASH in line:
        problems.append(("dash", "em dash found. Use a period or a comma."))
    if EN_DASH in line:
        problems.append(("dash", "en dash found. Use a period or a comma (write ranges with 'to')."))
    probe = re.sub(r"^[>\s]*", "", line)  # drop quote markers and indentation, so list markers do not match
    if re.search(r"(?<!-)--(?!-)", probe) or re.search(r"\s-\s", probe):
        problems.append(("dash", "dash used as punctuation. Use a period or a comma."))
    if ";" in line:
        problems.append(("semicolon", "semicolon found. Use a period or a comma."))
    return problems


def clean_line(line: str) -> str:
    """Strip inline markdown from one line and protect decimals and abbreviations."""
    line = re.sub(r"[*_`~]+", "", line)
    for abbreviation in ABBREVIATIONS:
        line = line.replace(abbreviation, abbreviation.replace(".", ""))
    line = re.sub(r"(?<=\d)\.(?=\d)", DOT_LEADER, line)
    return re.sub(r"\s+", " ", line).strip()


def strip_body(body: str) -> tuple[str, list[tuple[int, str]], list[tuple[int, str, str]]]:
    """Remove code, math, comments, Mermaid and JSX tags from the body.

    Returns the cleaned body (same number of lines as the input), the prose found inside
    component props as (line offset, text), and contract problems as (line offset, rule, message).
    """
    found: list[tuple[int, str, str]] = []

    body = re.sub(r"^[ \t]*(```|~~~)[^\n]*\n.*?^[ \t]*\1[ \t]*$", blank, body, flags=re.S | re.M)
    body = re.sub(r"<!--.*?-->", blank, body, flags=re.S)
    body = re.sub(r"\{/\*.*?\*/\}", blank, body, flags=re.S)
    body = re.sub(r"^[ \t]*(import|export)\s.*$", "", body, flags=re.M)

    for match in re.finditer(r"\$\$[^\n$]+\$\$", body):
        found.append((body.count("\n", 0, match.start()), "display-math", "single-line $$...$$ renders as small inline math. Put $$ on its own lines."))
    for match in re.finditer(r"\\\\[A-Za-z]", body):
        found.append((body.count("\n", 0, match.start()), "backslash", "doubled backslash. Write single backslashes in math and props."))

    for match in re.finditer(r"<Mermaid\b[^>]*>(.*?)</Mermaid>", body, flags=re.S):
        base = body.count("\n", 0, match.start(1))
        for index, line in enumerate(match.group(1).split("\n")):
            if EM_DASH in line or EN_DASH in line:
                found.append((base + index, "mermaid", "Unicode dash inside <Mermaid>. Use ASCII arrows such as -->."))
            if "{" in line or "}" in line:
                found.append((base + index, "mermaid", "braces are not allowed in <Mermaid> children. Use a fenced mermaid block."))
            if re.search(r"<br\s*>", line):
                found.append((base + index, "mermaid", "use <br/> and not <br> inside <Mermaid>."))
    body = re.sub(r"<Mermaid\b[^>]*>.*?</Mermaid>", blank, body, flags=re.S)

    body = re.sub(r"\$\$.*?\$\$", blank, body, flags=re.S)
    body = re.sub(r"(?<!\\)\$[^$\n]+?\$", "MATH", body)
    body = re.sub(r"`[^`\n]*`", "CODE", body)
    body = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", body)
    body = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", body)
    body = re.sub(r"https?://[^\s)\]>\"']+", "URL", body)
    body = re.sub(r"&#?\w+;", "", body)

    prose_in_props: list[tuple[int, str]] = []

    def take_tag(match: re.Match) -> str:
        tag = match.group(0)
        offset = body.count("\n", 0, match.start())
        spans = [(m.start(), m.group(1) if m.group(1) is not None else m.group(2)) for m in KEYED_PROSE.finditer(tag)]
        options = OPTIONS.search(tag)
        if options:
            spans += [(options.start(1) + m.start(), m.group(1)) for m in QUOTED.finditer(options.group(1))]
        for position, value in spans:
            if value.strip():
                prose_in_props.append((offset + tag.count("\n", 0, position), value))
        return "\n" * tag.count("\n")

    body = re.sub(r"</?[A-Za-z][^<>]*?/?>", take_tag, body, flags=re.S)
    return body, prose_in_props, found


def sentences_with_lines(paragraph_lines: list[tuple[int, str]]) -> list[tuple[int, str]]:
    """Split one paragraph into sentences and return (line number, sentence)."""
    starts, text = [], ""
    for line_number, line in paragraph_lines:
        if text:
            text += " "
        starts.append((len(text), line_number))
        text += line
    offsets = [s[0] for s in starts]
    result = []
    for match in re.finditer(r"[^.!?]+(?:[.!?]+|$)", text):
        sentence = match.group(0).strip()
        if not sentence:
            continue
        position = bisect.bisect_right(offsets, match.start() + (len(match.group(0)) - len(match.group(0).lstrip()))) - 1
        result.append((starts[max(position, 0)][1], sentence))
    return result


def count_words(sentence: str) -> int:
    return sum(1 for word in sentence.split() if re.search(r"\w", word))


def check_prose(path: Path, paragraph_lines: list[tuple[int, str]], max_words: int) -> list[Problem]:
    problems = []
    sentences = sentences_with_lines(paragraph_lines)
    total_words = 0
    for line_number, sentence in sentences:
        words = count_words(sentence)
        total_words += words
        if words > max_words:
            preview = " ".join(sentence.split()[:7])
            problems.append(Problem(path, line_number, "sentence", f"sentence has {words} words (maximum {max_words}): '{preview} ...'"))
    if paragraph_lines and (len(sentences) > MAX_PARAGRAPH_SENTENCES or total_words > MAX_PARAGRAPH_WORDS):
        problems.append(
            Problem(path, paragraph_lines[0][0], "paragraph", f"paragraph has {len(sentences)} sentences and {total_words} words. Split it.")
        )
    openers = [s.split()[0].lower().strip("\"'(") for _, s in sentences if s.split()]
    for index in range(len(openers) - 2):
        if openers[index] == openers[index + 1] == openers[index + 2] and openers[index] not in {"math", "code"}:
            problems.append(Problem(path, sentences[index][0], "repeat", f"three sentences in a row start with '{openers[index]}'"))
            break
    return problems


def lint_frontmatter(path: Path, lines: list[str], first_line: int, max_words: int) -> list[Problem]:
    problems = []
    for index, raw in enumerate(lines):
        line_number = first_line + index
        if raw.lstrip().startswith("#"):
            continue
        key = re.match(r"^(title|summary):", raw)
        if key and "$" in raw:
            problems.append(Problem(path, line_number, "title-math", f"math in {key.group(1)} is not rendered. Use plain text or Unicode."))
        value = re.sub(r"^\s*-\s+", "", raw)
        value = re.sub(r"^[A-Za-z_][\w-]*:(\s+|$)", "", value).strip().strip("\"'")
        if not value:
            continue
        for rule, message in check_characters(value):
            problems.append(Problem(path, line_number, rule, f"frontmatter: {message}"))
        words = count_words(clean_line(value))
        if words > max_words:
            problems.append(Problem(path, line_number, "sentence", f"frontmatter value has {words} words (maximum {max_words})"))
    return problems


def lint_text(path: Path, text: str, max_words: int) -> list[Problem]:
    all_lines = text.split("\n")
    front_lines, front_first, body_lines, body_first = split_frontmatter(all_lines)
    problems = lint_frontmatter(path, front_lines, front_first, max_words) if front_lines else []

    body, props, found = strip_body("\n".join(body_lines))
    for offset, rule, message in found:
        problems.append(Problem(path, body_first + offset, rule, message))
    cleaned_lines = body.split("\n")

    separator = re.compile(r"^\s*\|?[\s:|\-]+\|?\s*$")
    paragraph: list[tuple[int, str]] = []

    def flush() -> None:
        nonlocal paragraph
        if paragraph:
            problems.extend(check_prose(path, paragraph, max_words))
        paragraph = []

    for index, raw in enumerate(cleaned_lines):
        line_number = body_first + index
        if not raw.strip():
            flush()
            continue
        if separator.match(raw) and "|" in raw:
            continue
        for rule, message in check_characters(raw):
            problems.append(Problem(path, line_number, rule, message))
        if raw.lstrip().startswith("|"):
            flush()  # table rows are checked for characters only
            continue
        text_line = re.sub(r"^[>\s]*", "", raw)
        if re.match(r"^#{1,6}\s", text_line):
            flush()
            paragraph = [(line_number, clean_line(re.sub(r"^#{1,6}\s+", "", text_line)))]
            flush()
            continue
        if re.match(r"^([-*+]|\d+[.)])\s+", text_line):
            flush()
            text_line = re.sub(r"^([-*+]|\d+[.)])\s+", "", text_line)
        cleaned = clean_line(text_line)
        if cleaned:
            paragraph.append((line_number, cleaned))
    flush()

    for offset, value in props:
        line_number = body_first + offset
        for rule, message in check_characters(value):
            problems.append(Problem(path, line_number, rule, f"in a component prop: {message}"))
        problems.extend(check_prose(path, [(line_number, clean_line(value))], max_words))

    unique = {(p.line, p.rule, p.message): p for p in problems}
    return sorted(unique.values(), key=lambda p: (p.line, p.rule))


def collect_files(paths: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        path = Path(raw)
        if path.is_dir():
            doc = path / "doc.mdx"
            files.extend([doc] if doc.is_file() else sorted(path.rglob("doc.mdx")))
        else:
            files.append(path)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="Style and contract linter for lesson MDX files.")
    parser.add_argument("paths", nargs="+", help="an .mdx file, a lesson folder or a folder of lessons")
    parser.add_argument("--max-words", type=int, default=MAX_WORDS, help="maximum words per sentence")
    parser.add_argument("--errors-only", action="store_true", help="ignore warnings")
    args = parser.parse_args()

    files = collect_files(args.paths)
    if not files:
        print("No doc.mdx files found.")
        return 1

    problems: list[Problem] = []
    for file in files:
        if not file.is_file():
            print(f"{file}: file not found")
            return 1
        problems.extend(lint_text(file, file.read_text(encoding="utf-8"), args.max_words))
    if args.errors_only:
        problems = [p for p in problems if p.severity == "error"]

    for problem in problems:
        print(f"{problem.path}:{problem.line}: {problem.severity} [{problem.rule}] {problem.message}")
    errors = sum(1 for p in problems if p.severity == "error")
    warnings = len(problems) - errors
    if problems:
        print(f"\n{len(problems)} problems ({errors} errors, {warnings} warnings)")
        return 1
    print("0 problems")
    return 0


if __name__ == "__main__":
    sys.exit(main())
