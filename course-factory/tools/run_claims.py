#!/usr/bin/env python3
"""Run the executable claims of a lesson and compare them with the lesson's numbers.

Usage:
    python tools/run_claims.py <lesson-folder> [--strict]

The lesson folder must contain claims.json (see schemas/claims.schema.json) and
should contain doc.mdx. Every claim has a Python snippet that sets a variable
called `result`. The result is compared with `expected`, the number written in
the lesson.

Exit code 0 means every claim passed. Exit code 1 means a failure (or, with
--strict, a warning). A machine readable report is written to
<lesson-folder>/claims-report.json.

Note: the snippets run with a restricted set of builtins and imports and a time
limit. This is a guard rail against mistakes, not a security sandbox. Only run
claims written by your own agents.
"""

from __future__ import annotations

import argparse
import builtins
import cmath
import json
import math
import re
import signal
import sys
from contextlib import contextmanager
from pathlib import Path

ALLOWED_MODULES = {
    "math",
    "cmath",
    "numpy",
    "scipy",
    "sympy",
    "pint",
    "fractions",
    "statistics",
    "itertools",
    "functools",
}
SAFE_BUILTIN_NAMES = [
    "abs", "all", "any", "bool", "complex", "dict", "divmod", "enumerate",
    "float", "int", "isinstance", "len", "list", "map", "max", "min", "pow",
    "range", "round", "set", "sorted", "str", "sum", "tuple", "zip",
    "ValueError", "ZeroDivisionError", "ArithmeticError", "Exception",
]  # fmt: skip
TIME_LIMIT_SECONDS = 10
DEFAULT_RELATIVE_TOLERANCE = 0.005
DEFAULT_ABSOLUTE_TOLERANCE = 1e-12


class ClaimTimeout(Exception):
    pass


def _on_alarm(signum, frame):  # noqa: ARG001
    raise ClaimTimeout


@contextmanager
def time_limit(seconds: int):
    """Raise ClaimTimeout after `seconds`. Does nothing on platforms without SIGALRM."""
    if not hasattr(signal, "SIGALRM"):
        yield
        return
    previous = signal.signal(signal.SIGALRM, _on_alarm)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, previous)


def safe_import(name, globals=None, locals=None, fromlist=(), level=0):  # noqa: A002
    if level != 0 or name.split(".")[0] not in ALLOWED_MODULES:
        raise ImportError(f"import of '{name}' is not allowed in claims")
    return builtins.__import__(name, globals, locals, fromlist, level)


def make_namespace() -> dict:
    import numpy as np

    safe_builtins = {n: getattr(builtins, n) for n in SAFE_BUILTIN_NAMES}
    safe_builtins["__import__"] = safe_import
    namespace = {"__builtins__": safe_builtins, "math": math, "cmath": cmath, "np": np, "numpy": np}
    try:
        import scipy

        namespace["scipy"] = scipy
    except ImportError:
        pass
    return namespace


def to_float(value) -> tuple[float | None, str | None]:
    """Convert a claim result to a float, or explain why it cannot be one."""
    import numpy as np

    if isinstance(value, np.ndarray):
        if value.size != 1:
            return None, f"result must be a single number, got an array of shape {value.shape}"
        value = value.reshape(-1)[0].item()
    elif isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, complex):
        if abs(value.imag) <= 1e-12 * max(1.0, abs(value.real)):
            return float(value.real), None
        return None, "result is complex, use abs() or .real/.imag to pick a real number"
    try:
        return float(value), None
    except (TypeError, ValueError):
        return None, f"result is not a number: {value!r}"


def evaluate(claim: dict) -> tuple[float | None, str | None]:
    namespace = make_namespace()
    try:
        with time_limit(TIME_LIMIT_SECONDS):
            exec(compile(claim["code"], f"<claim {claim['id']}>", "exec"), namespace)  # noqa: S102
    except ClaimTimeout:
        return None, f"timed out after {TIME_LIMIT_SECONDS} s"
    except Exception as exc:  # noqa: BLE001
        return None, f"{type(exc).__name__}: {exc}"
    if "result" not in namespace:
        return None, "the code did not set a variable called `result`"
    return to_float(namespace["result"])


def allowed_difference(expected: float, tolerance: dict | None) -> float:
    tolerance = tolerance or {}
    relative = tolerance.get("relative")
    absolute = tolerance.get("absolute")
    if relative is None and absolute is None:
        relative, absolute = DEFAULT_RELATIVE_TOLERANCE, DEFAULT_ABSOLUTE_TOLERANCE
    return max(absolute or 0.0, (relative or 0.0) * abs(expected))


def validate_schema(data: dict) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) from checking claims.json against its JSON Schema."""
    schema_path = Path(__file__).resolve().parent.parent / "schemas" / "claims.schema.json"
    try:
        import jsonschema
    except ImportError:
        return [], ["jsonschema is not installed, so claims.json was not checked against its schema"]
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validator = jsonschema.Draft202012Validator(schema)
    errors = []
    for error in sorted(validator.iter_errors(data), key=lambda e: list(e.path)):
        location = "/".join(str(p) for p in error.path) or "(root)"
        errors.append(f"schema: {location}: {error.message}")
    return errors, []


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the executable claims of a lesson.")
    parser.add_argument("lesson", type=Path, help="lesson folder with claims.json and doc.mdx")
    parser.add_argument("--strict", action="store_true", help="treat warnings as failures")
    args = parser.parse_args()

    folder: Path = args.lesson
    claims_path = folder / "claims.json"
    doc_paths = sorted(folder.rglob("doc.mdx"))

    if not claims_path.is_file():
        print(f"FAIL: {claims_path} does not exist. Every lesson needs a claims.json.")
        return 1
    try:
        data = json.loads(claims_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"FAIL: {claims_path} is not valid JSON: {exc}")
        return 1

    errors, warnings = validate_schema(data)
    if errors:
        for message in errors:
            print(f"FAIL  {message}")
        print(f"\n{len(errors)} schema problem(s). Fix claims.json first.")
        return 1

    if data.get("lesson") and data["lesson"] != folder.resolve().name:
        warnings.append(f"claims.json says lesson '{data['lesson']}' but the folder is '{folder.resolve().name}'")

    # A lesson contains one or more part folders, each with its own doc.mdx.
    doc_text = (
        normalize_space(" ".join(path.read_text(encoding="utf-8") for path in doc_paths))
        if doc_paths
        else None
    )
    if doc_text is None:
        warnings.append("no doc.mdx found, so claim texts were not looked up")

    claims = data["claims"]
    if not claims:
        warnings.append("claims.json has no claims. Is it true that the lesson has no computed numbers?")

    seen: set[str] = set()
    report = []
    failures = 0
    for claim in claims:
        entry = {"id": claim["id"], "kind": claim["kind"], "expected": claim["expected"], "text": claim["text"]}
        if claim["id"] in seen:
            entry.update(status="FAIL", message="duplicate claim id")
        else:
            result, problem = evaluate(claim)
            entry["result"] = result
            if problem:
                entry.update(status="FAIL", message=problem)
            else:
                allowed = allowed_difference(claim["expected"], claim.get("tolerance"))
                entry["allowed_difference"] = allowed
                if abs(result - claim["expected"]) <= allowed:
                    entry.update(status="PASS", message="")
                else:
                    entry.update(
                        status="FAIL",
                        message=f"computed {result:.10g} but the lesson says {claim['expected']:.10g} (allowed difference {allowed:.3g})",
                    )
        seen.add(claim["id"])
        if entry["status"] == "PASS" and doc_text is not None and normalize_space(claim["text"]) not in doc_text:
            warnings.append(f"claim '{claim['id']}': text {claim['text']!r} was not found in doc.mdx")
        if entry["status"] == "FAIL":
            failures += 1
        report.append(entry)

    for entry in report:
        line = f"{entry['status']:<5} {entry['id']}"
        if entry["message"]:
            line += f"  {entry['message']}"
        elif entry.get("result") is not None:
            line += f"  {entry['result']:.10g}"
        print(line)
    for message in warnings:
        print(f"WARN  {message}")

    passed = len(report) - failures
    print(f"\n{passed}/{len(report)} claims passed, {failures} failed, {len(warnings)} warning(s)")

    summary = {"lesson": folder.resolve().name, "passed": passed, "failed": failures, "warnings": warnings, "claims": report}
    (folder / "claims-report.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if failures or (args.strict and warnings):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
