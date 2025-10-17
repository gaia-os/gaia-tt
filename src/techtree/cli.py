"""CLI entry points for TechTree tools.

Provides a simple way to run the Python NuclearScheduler from the command line
and emit results in the same shape the frontend expects.

Usage:
    nuclear-scheduler --graph path/to/graph.json --years 20 \
        --out scripts/data/simulations/latest/results.json

The input graph can be either of:
- {"nodes": [...], "edges": [...]} where nodes follow the TS schema with
  data.* fields or the pythonic {id,label,type,...} schema; OR
- {"graph": {"nodes": [...], "edges": [...]}} legacy wrapper.

This keeps frontend/backend loosely coupled without introducing a DB.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

from techtree.scheduler import NuclearScheduler
from techtree.simulator.runner import save_results


def _load_graph(path: Path) -> Dict[str, Any]:
    data = json.loads(path.read_text())
    # Accept either a bare {nodes,edges} or {graph:{nodes,edges}}
    if isinstance(data, dict) and ("nodes" in data and "edges" in data or "graph" in data):
        return data
    # Accept a payload that looks like the TS return shape {impactData,statusData}
    # to avoid accidental misuse.
    raise ValueError(
        "Unrecognized input JSON. Expecting {nodes,edges} or {graph:{nodes,edges}}."
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run NuclearScheduler on a tech tree graph")
    parser.add_argument(
        "--graph",
        type=Path,
        required=True,
        help="Path to graph JSON ({nodes,edges} or {graph:{nodes,edges}})",
    )
    parser.add_argument(
        "--years", "-y", type=int, default=20, help="Years to simulate (default: 20)"
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("scripts/data/simulations/latest/results.json"),
        help="Output JSON path (default: scripts/data/simulations/latest/results.json)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    graph = _load_graph(args.graph)

    scheduler = NuclearScheduler(graph)
    impact_table, status_table = scheduler.run_simulation(years_to_simulate=args.years)

    # Write a combined payload the frontend expects
    save_results(impact_table, status_table, out_path=args.out)


if __name__ == "__main__":
    main()
