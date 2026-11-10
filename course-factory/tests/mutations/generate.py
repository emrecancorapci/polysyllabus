#!/usr/bin/env python3
"""Generate the mutation test set for the math verification pipeline.

Usage:
    python tests/mutations/generate.py [--base <lesson-folder>] [--out <dir>]

Copies the base lesson and seeds exactly one writer-style error per mutant.
The mutants live in tests/mutations/generated/ (gitignored, regenerate anytime).
Pair with tools/run_mutations.py for the deterministic catch table, then run the
math evaluator on each mutant for the independent-catch half of the report.

Each mutation models a realistic writer error. "Self-consistent" means the text,
the claim code and the claim expected value were all changed together, so
run_claims.py passes and only the independent evaluator can catch it.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

FACTORY = Path(__file__).resolve().parent.parent.parent
DEFAULT_BASE = FACTORY / "work" / "analog-electronics" / "1-common-emitter-amplifier"
DEFAULT_OUT = Path(__file__).resolve().parent / "generated"

MUTANTS: list[dict] = [
    {
        "id": "m01-factor-2-selfconsistent",
        "catcher": "evaluator",
        "seed": "Factor of 2 dropped in Ic = Ve/Re. Text, code and expected changed together.",
        "docs": [("4-bias-point/doc.mdx", "the collector current is 1.0 mA", "the collector current is 0.5 mA")],
        "claims": [
            {
                "id": "bias-collector-current",
                "set": {"text": "0.5 mA", "expected": 0.5, "code": "VE = 1.1\nRE = 1.1e3\nresult = VE / (2 * RE) * 1e3"},
            }
        ],
    },
    {
        "id": "m02-sign-swap-selfconsistent",
        "catcher": "evaluator",
        "seed": "Gain sign flipped to +188 in text, code and expected. The lesson still calls it inverted.",
        "docs": [("5-small-signal-gain/doc.mdx", "$A_v = -188$", "$A_v = 188$")],
        "claims": [
            {
                "id": "gain-bypassed",
                "set": {"text": "188", "expected": 188, "code": "gm = 1.0e-3 / 25e-3\nRC = 4.7e3\nresult = gm * RC"},
            }
        ],
    },
    {
        "id": "m03-prefix-k-to-m",
        "catcher": "evaluator",
        "seed": "R1 prefix k changed to M in the given values, result recomputed to match (2.1 mV).",
        "docs": [
            ("4-bias-point/doc.mdx", "$R_1 = 68\\,\\text{k}\\Omega$ and $R_2 = 12\\,\\text{k}\\Omega$", "$R_1 = 68\\,\\text{M}\\Omega$ and $R_2 = 12\\,\\text{k}\\Omega$"),
            ("4-bias-point/doc.mdx", "The divider holds the base at 1.8 V.", "The divider holds the base at 2.1 mV."),
        ],
        "claims": [
            {
                "id": "bias-base-voltage",
                "set": {
                    "text": "2.1 mV",
                    "expected": 2.117273,
                    "unit": "mV",
                    "code": "VCC = 12.0\nR1 = 68e6\nR2 = 12e3\nresult = VCC * R2 / (R1 + R2) * 1e3",
                    "quantities": [
                        {"name": "V_CC", "value": 12, "unit": "V"},
                        {"name": "R1", "value": 68, "unit": "MΩ"},
                        {"name": "R2", "value": 12, "unit": "kΩ"},
                    ],
                },
            }
        ],
    },
    {
        "id": "m04-quiz-claims-mismatch",
        "catcher": "run_claims",
        "seed": "NumericQuiz answer key changed to 5.2 in text and in the claim expected, but the claim code still computes the true 4.8.",
        "docs": [
            ("4-bias-point/doc.mdx", "answer={4.8}", "answer={5.2}"),
            ("4-bias-point/doc.mdx", "= 4.8\\,\\text{V}$.", "= 5.2\\,\\text{V}$."),
        ],
        "claims": [{"id": "quiz-bias-vce", "set": {"text": "answer={5.2}", "expected": 5.2}}],
    },
    {
        "id": "m05-mcq-wrong-index",
        "catcher": "evaluator",
        "seed": "Multiple choice answer index changed from 2 to 3 (points at the 'gain falls to exactly zero' option).",
        "docs": [("6-unbypassed-gain/doc.mdx", "answer={2}", "answer={3}")],
        "claims": [],
    },
    {
        "id": "m06-text-typo-warning-only",
        "catcher": "evaluator (run_claims only warns)",
        "seed": "Lesson text says Vce = 6.5 V while claims still say 6.2 V. run_claims reports a text-not-found warning, not a failure.",
        "docs": [("4-bias-point/doc.mdx", "collector-to-emitter voltage of 6.2 V", "collector-to-emitter voltage of 6.5 V")],
        "claims": [],
    },
    {
        "id": "m07-unit-error",
        "catcher": "evaluator",
        "seed": "Transconductance unit written as W instead of S, in text and in the claim.",
        "docs": [("5-small-signal-gain/doc.mdx", "The transconductance is 40 mS.", "The transconductance is 40 W.")],
        "claims": [{"id": "small-signal-gm", "set": {"text": "40 W", "unit": "W"}}],
    },
    {
        "id": "m08-tolerance-broken",
        "catcher": "evaluator",
        "seed": "NumericQuiz tolerance loosened from rel 0.02 to rel 0.9, so almost any answer is accepted.",
        "docs": [("4-bias-point/doc.mdx", "tolerance={{ rel: 0.02 }}", "tolerance={{ rel: 0.9 }}")],
        "claims": [
            {
                "id": "quiz-bias-vce",
                "set": {"source": "NumericQuiz answer. The quiz tolerance is rel 0.9."},
            }
        ],
    },
    {
        "id": "m09-unclaimed-number",
        "catcher": "evaluator",
        "seed": "A new computed number (output resistance 4.7 kΩ) added to the text with no claim entry.",
        "docs": [("6-unbypassed-gain/doc.mdx", "## Key takeaways", "At this bias point the stage's output resistance is 4.7 kΩ.\n\n## Key takeaways")],
        "claims": [],
    },
    {
        "id": "m10-limit-behavior",
        "catcher": "evaluator",
        "seed": "Inversion direction flipped in prose: a positive input wiggle now 'gives a positive output wiggle'.",
        "docs": [
            ("5-small-signal-gain/doc.mdx", "So a positive input wiggle gives a negative output wiggle.", "So a positive input wiggle gives a positive output wiggle.")
        ],
        "claims": [],
    },
]


def apply_doc_edits(folder: Path, edits: list[tuple[str, str, str]]) -> list[str]:
    problems = []
    by_file: dict[str, list[tuple[str, str]]] = {}
    for rel, old, new in edits:
        by_file.setdefault(rel, []).append((old, new))
    for rel, pairs in by_file.items():
        path = folder / rel
        text = path.read_text(encoding="utf-8")
        for old, new in pairs:
            count = text.count(old)
            if count != 1:
                problems.append(f"{rel}: expected 1 occurrence of {old!r}, found {count}")
                continue
            text = text.replace(old, new)
        path.write_text(text, encoding="utf-8")
    return problems


def apply_claim_edits(folder: Path, edits: list[dict], mutant_id: str) -> list[str]:
    problems = []
    path = folder / "claims.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["lesson"] = mutant_id  # keep the folder-name warning quiet, it is noise here
    for edit in edits:
        found = [c for c in data["claims"] if c["id"] == edit["id"]]
        if len(found) != 1:
            problems.append(f"claim {edit['id']!r}: {len(found)} matches")
            continue
        found[0].update(edit["set"])
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the mutation test set.")
    parser.add_argument("--base", type=Path, default=DEFAULT_BASE, help="base lesson folder")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="output folder for mutants")
    args = parser.parse_args()

    if not (args.base / "claims.json").is_file():
        print(f"FAIL: base lesson {args.base} has no claims.json")
        return 1
    args.out.mkdir(parents=True, exist_ok=True)

    problems = []
    for mutant in MUTANTS:
        target = args.out / mutant["id"]
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(args.base, target, ignore=shutil.ignore_patterns("claims-report.json", "screenshot.png"))
        problems += apply_doc_edits(target, mutant["docs"])
        problems += apply_claim_edits(target, mutant["claims"], mutant["id"])
        print(f"seeded {mutant['id']}: {mutant['seed']}")
    if problems:
        print("\nFAIL: anchors did not match, regenerate is stale:")
        for problem in problems:
            print(f"  {problem}")
        return 1
    print(f"\n{len(MUTANTS)} mutants in {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
