#!/usr/bin/env python3
"""Run run_claims.py over the generated mutation set and report the catches.

Usage:
    python tools/run_mutations.py [--dir tests/mutations/generated]

Deterministic half of the mutation report. The math evaluator provides the
independent-catch half, see tests/mutations/REPORT.md. Exit code 0 when the
table was produced (it is a measurement, not a gate).
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

FACTORY = Path(__file__).resolve().parent.parent
DEFAULT_DIR = FACTORY / "tests" / "mutations" / "generated"


def evaluate(mutant: Path) -> dict:
    """Run run_claims.py in a subprocess and summarize the outcome."""
    result = subprocess.run(
        [sys.executable, str(FACTORY / "tools" / "run_claims.py"), str(mutant)],
        capture_output=True,
        text=True,
        timeout=120,
    )
    output = result.stdout + result.stderr
    warnings = re.findall(r"^WARN\s+(.*)$", output, re.M)
    return {
        "exit": result.returncode,
        "caught": result.returncode != 0,
        "warned": bool(warnings),
        "warnings": warnings,
        "summary": next((line for line in output.splitlines() if "claims passed" in line), ""),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Deterministic mutation catch table.")
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR, help="folder with generated mutants")
    args = parser.parse_args()

    mutants = sorted(path for path in args.dir.iterdir() if path.is_dir()) if args.dir.is_dir() else []
    if not mutants:
        print(f"No mutants in {args.dir}. Run tests/mutations/generate.py first.")
        return 1

    caught = 0
    warned = 0
    print(f"{'mutant':<34} {'run_claims':<12} warnings")
    print("-" * 70)
    for mutant in mutants:
        outcome = evaluate(mutant)
        caught += outcome["caught"]
        warned += outcome["warned"]
        status = "FAIL (caught)" if outcome["caught"] else "pass (missed)"
        flag = f"{len(outcome['warnings'])}" if outcome["warnings"] else "-"
        print(f"{mutant.name:<34} {status:<12} {flag}")
        if outcome["warnings"]:
            for warning in outcome["warnings"]:
                print(f"    WARN {warning}")
    print("-" * 70)
    print(f"{caught}/{len(mutants)} caught by run_claims.py alone, {warned} with warnings")
    print("Self-consistent mutants need the math evaluator, see tests/mutations/REPORT.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
