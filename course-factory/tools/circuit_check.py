#!/usr/bin/env python3
"""Verify circuit numbers with a small modified nodal analysis (MNA) solver.

Usage:
    python tools/circuit_check.py <netlist.json>          # solve and print
    python tools/circuit_check.py --selftest              # RC filter and CE bias checks

The netlist is a JSON file, so agents can write it without a SPICE syntax
reference. No simulator is needed, only numpy. ngspice (PySpice) remains the
fallback for anything this solver does not model.

Netlist format (all keys required unless noted):

    {
      "title": "CE stage bias point",
      "analysis": { "kind": "dc" },                  // or { "kind": "ac", "freq": 1591.5 }
      "ground": "gnd",
      "nodes": ["vb", "ve", "vc"],                   // every node except ground
      "elements": [
        { "type": "R", "nodes": ["vc", "vcc"], "value": 4700 },   // ohm
        { "type": "C", "nodes": ["in", "out"], "value": 100e-9 }, // farad, ac only
        { "type": "V", "nodes": ["vcc", "gnd"], "value": 12 },    // volt, node a is +
        { "type": "I", "nodes": ["vc", "gnd"], "value": 1e-3 }    // ampere, flows a -> b inside
      ],
      "transfer": { "in": ["in", "gnd"], "out": ["out", "gnd"] }  // optional, prints dB and phase
    }

Voltage sources add one branch current unknown each. Capacitors are open at dc
and admit j*w*C at ac. Exit code 0 on success, 1 on netlist or math problems.
"""

from __future__ import annotations

import argparse
import cmath
import json
import sys

import numpy as np


def load(netlist: dict) -> tuple[dict, dict]:
    """Return (parsed model, error). Validates shape and values."""
    try:
        ground = netlist["ground"]
        nodes = list(netlist["nodes"])
        analysis = netlist["analysis"]
        elements = netlist["elements"]
        kind = analysis["kind"]
    except (KeyError, TypeError) as exc:
        return {}, f"missing key: {exc}"
    if kind not in {"dc", "ac"}:
        return {}, f"unknown analysis kind {kind!r}"
    if kind == "ac" and "freq" not in analysis:
        return {}, "ac analysis needs freq (Hz)"
    freq = float(analysis.get("freq", 0.0))
    if ground in nodes:
        return {}, f"ground node {ground!r} must not be listed in nodes"
    index = {name: i for i, name in enumerate(nodes)}
    if len(index) != len(nodes):
        return {}, "duplicate node names"

    stamped: list[dict] = []
    for element in elements:
        etype = element.get("type")
        pair = element.get("nodes")
        value = element.get("value")
        if not isinstance(pair, list) or len(pair) != 2:
            return {}, f"{etype}: nodes must be a pair, got {pair!r}"
        for node in pair:
            if node != ground and node not in index:
                return {}, f"{etype}: unknown node {node!r}"
        if not isinstance(value, (int, float)):
            return {}, f"{etype}: value must be a number, got {value!r}"
        stamped.append({"type": etype, "a": pair[0], "b": pair[1], "value": float(value)})
    return {
        "ground": ground,
        "index": index,
        "kind": kind,
        "freq": freq,
        "elements": stamped,
        "transfer": netlist.get("transfer"),
        "title": netlist.get("title", "netlist"),
    }, None


def solve(model: dict) -> tuple[dict, None] | tuple[None, str]:
    """Run MNA. Returns node voltages (complex for ac) plus source currents."""
    n = len(model["index"])
    voltage_sources = [e for e in model["elements"] if e["type"] == "V"]
    size = n + len(voltage_sources)
    a = np.zeros((size, size), dtype=complex)
    z = np.zeros(size, dtype=complex)
    omega = 2 * cmath.pi * model["freq"] if model["kind"] == "ac" else 0.0
    index = model["index"]
    ground = model["ground"]

    def pair(node: str) -> tuple[int | None, int]:
        """Map a node name to (own index or None for ground, ground column index)."""
        return (index[node] if node in index else None), -1

    def conductance(node_a: str, node_b: str, g: complex) -> None:
        ia, ja = pair(node_a)
        ib, jb = pair(node_b)
        if ia is not None:
            a[ia, ia] += g
            if ib is not None:
                a[ia, ib] -= g
        if ib is not None:
            a[ib, ib] += g
            if ia is not None:
                a[ib, ia] -= g

    branch = n
    for element in model["elements"]:
        etype, na, nb, value = element["type"], element["a"], element["b"], element["value"]
        if etype == "R":
            if value == 0:
                return None, "resistor value is zero"
            conductance(na, nb, 1 / value)
        elif etype == "C":
            if model["kind"] == "dc":
                continue  # open circuit
            conductance(na, nb, 1j * omega * value)
        elif etype == "V":
            ia, _ = pair(na)
            ib, _ = pair(nb)
            if ia is not None:
                a[ia, branch] += 1
                a[branch, ia] += 1
            if ib is not None:
                a[ib, branch] -= 1
                a[branch, ib] -= 1
            z[branch] = value
            branch += 1
        elif etype == "I":
            ia, _ = pair(na)
            ib, _ = pair(nb)
            if ia is not None:
                z[ia] -= value
            if ib is not None:
                z[ib] += value
        else:
            return None, f"unknown element type {etype!r}"

    try:
        x = np.linalg.solve(a, z)
    except np.linalg.LinAlgError as exc:
        return None, f"singular system ({exc}). Floating nodes need a dc path to ground."
    voltages = {name: x[i] for i, name in enumerate(index)}
    for i, source in enumerate(voltage_sources):
        voltages[f"I({source['a']},{source['b']})"] = x[n + i]
    return voltages, None


def main() -> int:
    parser = argparse.ArgumentParser(description="Tiny MNA solver for circuit checks.")
    parser.add_argument("netlist", nargs="?", type=argparse.FileType("r"), help="netlist JSON file")
    parser.add_argument("--selftest", action="store_true", help="run the built in checks")
    args = parser.parse_args()

    if args.selftest:
        return selftest()
    if args.netlist is None:
        parser.error("give a netlist file or --selftest")

    try:
        netlist = json.load(args.netlist)
    except json.JSONDecodeError as exc:
        print(f"FAIL: netlist is not valid JSON: {exc}")
        return 1
    model, error = load(netlist)
    if error:
        print(f"FAIL: {error}")
        return 1
    voltages, error = solve(model)
    if error:
        print(f"FAIL: {error}")
        return 1
    print(model["title"])
    for name, value in voltages.items():
        if model["kind"] == "ac":
            print(f"  {name:<12} {value.real:>12.6g}{value.imag:+.6g}j V")
        else:
            print(f"  {name:<12} {value.real:>12.6g} V")
    transfer = model["transfer"]
    if transfer:
        va = voltages.get(transfer["out"][0], 0) - voltages.get(transfer["out"][1], 0)
        vb = voltages.get(transfer["in"][0], 0) - voltages.get(transfer["in"][1], 0)
        if vb == 0:
            print("FAIL: transfer input voltage is zero")
            return 1
        ratio = va / vb
        db = 20 * np.log10(abs(ratio))
        phase = cmath.phase(ratio) * 180 / cmath.pi
        print(f"  transfer     {db:.4f} dB, phase {phase:.2f} deg")
    return 0


def selftest() -> int:
    """Two textbook checks: RC low-pass at fc, and the CE bias point of sprint 1."""
    failures = 0

    def close(actual: float, expected: float, tol: float, label: str) -> None:
        nonlocal failures
        ok = abs(actual - expected) <= tol
        print(f"  {'PASS' if ok else 'FAIL'}  {label}: got {actual:.6g}, expected {expected:.6g}")
        if not ok:
            failures += 1

    r, c = 1e3, 100e-9
    fc = 1 / (2 * cmath.pi * r * c)
    rc_netlist = {
        "title": "RC low-pass divider",
        "analysis": {"kind": "ac", "freq": fc},
        "ground": "gnd",
        "nodes": ["vin", "vout"],
        "elements": [
            {"type": "V", "nodes": ["vin", "gnd"], "value": 1},
            {"type": "R", "nodes": ["vin", "vout"], "value": r},
            {"type": "C", "nodes": ["vout", "gnd"], "value": c},
        ],
        "transfer": {"in": ["vin", "gnd"], "out": ["vout", "gnd"]},
    }
    model, error = load(rc_netlist)
    voltages, error = (model, None) if not error else (None, error)
    if not error:
        voltages, error = solve(model)
    print("RC low-pass at f_c (expect -3.0103 dB and -45 deg):")
    if error:
        print(f"  FAIL  solver: {error}")
        failures += 1
    else:
        ratio = voltages["vout"] / voltages["vin"]
        db = 20 * np.log10(abs(ratio))
        phase = cmath.phase(ratio) * 180 / cmath.pi
        close(db, -3.0103, 0.01, "gain at fc (dB)")
        close(phase, -45.0, 0.01, "phase at fc (deg)")

    ce_netlist = {
        "title": "CE stage bias point (Ic from the hand analysis)",
        "analysis": {"kind": "dc"},
        "ground": "gnd",
        "nodes": ["vb", "ve", "vc", "vcc"],
        "elements": [
            {"type": "V", "nodes": ["vcc", "gnd"], "value": 12},
            {"type": "R", "nodes": ["vcc", "vb"], "value": 68e3},
            {"type": "R", "nodes": ["vb", "gnd"], "value": 12e3},
            {"type": "R", "nodes": ["vcc", "vc"], "value": 4.7e3},
            {"type": "R", "nodes": ["ve", "gnd"], "value": 1.1e3},
            # BJT at the bias point: base current ignored, Ic = Ie pulled from ve to vc
            {"type": "I", "nodes": ["vc", "ve"], "value": 1e-3},
        ],
    }
    model, error = load(ce_netlist)
    if not error:
        voltages, error = solve(model)
    print("CE bias point (expect Vb 1.8, Ve 1.1, Vc 7.3, Vce 6.2):")
    if error:
        print(f"  FAIL  solver: {error}")
        failures += 1
    else:
        close(voltages["vb"].real, 1.8, 1e-9, "Vb (V)")
        close(voltages["ve"].real, 1.1, 1e-9, "Ve (V)")
        close(voltages["vc"].real, 7.3, 1e-9, "Vc (V)")
        close((voltages["vc"] - voltages["ve"]).real, 6.2, 1e-9, "Vce (V)")

    if failures:
        print(f"\n{failures} selftest failure(s)")
        return 1
    print("\nselftest passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
