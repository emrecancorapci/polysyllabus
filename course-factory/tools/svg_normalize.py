#!/usr/bin/env python3
"""Make generated SVG figures friendly to light and dark themes.

Usage:
    python tools/svg_normalize.py <lesson-folder | file.svg> [...] [--check] [--keep-size]

For every fig-*.svg (or the given .svg files) this tool:
    - turns black fills and strokes into currentColor
    - turns white fills into none (removes white backgrounds) and white strokes into currentColor
    - removes background declarations from the root element
    - adds a viewBox when only width and height exist
    - removes fixed width and height when a viewBox exists
    - adds role="img" when missing
    - removes editor metadata (metadata, sodipodi:namedview)

It also removes the width and height attributes (the site scales the figure), unless
--keep-size is given. With --check nothing is written and the exit code is 1 if any file
would change.

The frontend inlines figure SVGs, so currentColor follows the light and dark theme.
"""

from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NAMESPACES = {
    "": "http://www.w3.org/2000/svg",
    "xlink": "http://www.w3.org/1999/xlink",
    "inkscape": "http://www.inkscape.org/namespaces/inkscape",
    "sodipodi": "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd",
    "dc": "http://purl.org/dc/elements/1.1/",
    "cc": "http://creativecommons.org/ns#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
}
for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)

SVG = "{http://www.w3.org/2000/svg}"
BLACK = {"#000", "#000000", "black", "rgb(0,0,0)", "rgb(0%,0%,0%)"}
WHITE = {"#fff", "#ffffff", "white", "rgb(255,255,255)", "rgb(100%,100%,100%)"}
REMOVED_TAGS = {SVG + "metadata", "{" + NAMESPACES["sodipodi"] + "}namedview"}


def normalize_color(prop: str, value: str) -> tuple[str, bool]:
    """Return (new value, changed) for a fill or stroke value."""
    key = re.sub(r"\s+", "", value.strip().lower())
    if key in BLACK:
        return "currentColor", True
    if key in WHITE:
        return ("none", True) if prop == "fill" else ("currentColor", True)
    return value, False


def normalize_style(style: str, drop_background: bool = False) -> tuple[str, int]:
    """Normalize colors inside an inline style attribute. Returns (style, number of changes)."""
    changes = 0
    parts = []
    for declaration in style.split(";"):
        if ":" not in declaration:
            if declaration.strip():
                parts.append(declaration.strip())
            continue
        prop, value = declaration.split(":", 1)
        name = prop.strip().lower()
        if drop_background and name in {"background", "background-color"}:
            changes += 1
            continue
        if name in {"fill", "stroke"}:
            value, changed = normalize_color(name, value)
            changes += changed
        parts.append(f"{prop.strip()}:{value.strip()}")
    return ";".join(parts), changes


def normalize_css(css: str) -> tuple[str, int]:
    """Normalize colors inside the text of a <style> element."""
    changes = 0

    def replace(match: re.Match) -> str:
        nonlocal changes
        value, changed = normalize_color(match.group(1).lower(), match.group(2))
        changes += changed
        return f"{match.group(1)}:{value}"

    css = re.sub(r"\b(fill|stroke)\s*:\s*([^;}\n]+)", replace, css, flags=re.I)
    return css, changes


def number(value: str) -> float | None:
    match = re.fullmatch(r"\s*([0-9.]+)\s*(px|pt)?\s*", value or "")
    return float(match.group(1)) if match else None


def normalize_tree(root: ET.Element, responsive: bool) -> int:
    changes = 0
    for parent in list(root.iter()):
        for child in list(parent):
            if child.tag in REMOVED_TAGS:
                parent.remove(child)
                changes += 1

    for element in root.iter():
        for prop in ("fill", "stroke"):
            if prop in element.attrib:
                value, changed = normalize_color(prop, element.attrib[prop])
                if changed:
                    element.set(prop, value)
                    changes += 1
        if "style" in element.attrib:
            style, count = normalize_style(element.attrib["style"], drop_background=element is root)
            if count:
                element.set("style", style)
                changes += count
        if element.tag == SVG + "style" and element.text:
            css, count = normalize_css(element.text)
            if count:
                element.text = css
                changes += count

    if "viewBox" not in root.attrib:
        width, height = number(root.get("width", "")), number(root.get("height", ""))
        if width and height:
            root.set("viewBox", f"0 0 {width:g} {height:g}")
            changes += 1
    if responsive and "viewBox" in root.attrib:
        for attribute in ("width", "height"):
            if attribute in root.attrib:
                del root.attrib[attribute]
                changes += 1
    if "role" not in root.attrib:
        root.set("role", "img")
        changes += 1
    return changes


def process(path: Path, check: bool, responsive: bool) -> bool:
    """Normalize one file. Returns True if the file changed (or would change with --check)."""
    original = path.read_text(encoding="utf-8")
    tree = ET.ElementTree(ET.fromstring(original))
    root = tree.getroot()
    changes = normalize_tree(root, responsive)
    result = ET.tostring(root, encoding="unicode") + "\n"
    changed = result != original and changes > 0
    if changed and not check:
        path.write_text(result, encoding="utf-8")
    if changed:
        verb = "would change" if check else "normalized"
        print(f"{verb}: {path} ({changes} change{'s' if changes != 1 else ''})")
    else:
        print(f"ok: {path}")
    return changed


def collect(paths: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        path = Path(raw)
        files.extend(sorted(path.glob("fig-*.svg")) if path.is_dir() else [path])
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="Make generated SVG figures theme friendly.")
    parser.add_argument("paths", nargs="+", help="a lesson folder or .svg files")
    parser.add_argument("--check", action="store_true", help="do not write, exit 1 if a file would change")
    parser.add_argument("--keep-size", action="store_true", help="keep width and height attributes")
    args = parser.parse_args()

    files = collect(args.paths)
    if not files:
        print("No SVG files found (looked for fig-*.svg).")
        return 0
    any_changed = False
    for file in files:
        try:
            any_changed |= process(file, args.check, not args.keep_size)
        except (ET.ParseError, OSError) as exc:
            print(f"error: {file}: {exc}")
            return 1
    return 1 if (args.check and any_changed) else 0


if __name__ == "__main__":
    sys.exit(main())
