"""
Demonstrate the NuclearScheduler by running a small example graph and logging output.
Results are written under scripts/data/scheduler_demos/<run_name>/.
"""
import argparse
import json
import shutil
from pathlib import Path

from techtree.logger import log_to_file, logger
from techtree.scheduler import NuclearScheduler

LOG_LEVEL = "INFO"  # Use string for our custom logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a minimal NuclearScheduler demo")

    parser.add_argument(
        "-y",
        "--years",
        type=int,
        default=10,
        help="Years to simulate (default: 10)",
    )
    parser.add_argument(
        "-n",
        "--name",
        type=str,
        default="latest",
        help="Run name (default: 'latest')",
    )
    return parser.parse_args()


def build_demo_graph() -> dict:
    """
    Construct a tiny demo graph with two milestones and one enabling technology
    leading to two reactor concepts. This exercises dependencies and the
    impact calculation paths.
    """
    nodes = [
        {"id": "m1", "label": "Milestone A", "type": "Milestone", "trl_current": "6"},
        {"id": "m2", "label": "Milestone B", "type": "Milestone", "trl_current": "5"},
        {
            "id": "et1",
            "label": "HT Materials",
            "type": "EnablingTechnology",
            "trl_current": "4",
        },
        {"id": "c1", "label": "Concept 1", "type": "ReactorConcept"},
        {"id": "c2", "label": "Concept 2", "type": "ReactorConcept"},
    ]

    # m1 and m2 must finish before enabling tech et1 can start; concepts depend on et1
    edges = [
        {"source": "m1", "target": "et1"},
        {"source": "m2", "target": "et1"},
        {"source": "et1", "targets": ["c1", "c2"]},  # multi-target example
    ]

    # NuclearScheduler accepts either {nodes,edges} or {graph:{nodes,edges}}
    return {"nodes": nodes, "edges": edges}


def main() -> None:
    args = parse_args()

    run_name = args.name
    base_dir = Path(__file__).parent / "data" / "scheduler_demos" / run_name
    if base_dir.exists():
        if run_name == "latest":
            # Overwrite without confirm
            shutil.rmtree(base_dir)
        else:
            response = input(f"Directory {base_dir} already exists. Delete it? [y/N] ")
            if response.lower() == 'y':
                shutil.rmtree(base_dir)
            else:
                logger.error("Directory exists and user chose not to delete it. Exiting.")
                return

    base_dir.mkdir(parents=True, exist_ok=True)
    base_dir.mkdir(parents=True, exist_ok=True)

    impact_json = base_dir / "impact.json"
    status_json = base_dir / "status.json"
    log_out = base_dir / "log.out"
    log_to_file(str(log_out), level=LOG_LEVEL)

    graph = build_demo_graph()

    logger.info("Initializing NuclearScheduler demo")
    logger.info(f"Graph has {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")

    sched = NuclearScheduler(graph)

    logger.info(f"Running scheduler for {args.years} years...")
    impact_table, status_table = sched.run_simulation(years_to_simulate=args.years)

    # Log a brief summary
    active_impacts = sum(len(v) for v in impact_table.values())
    logger.info(f"Computed impacts for {active_impacts} active node-years")

    # Write results to JSON
    with impact_json.open("w") as f:
        json.dump(impact_table, f, indent=2)
    with status_json.open("w") as f:
        json.dump(status_table, f, indent=2)

    logger.info(f"Wrote impact to: {impact_json.resolve()}")
    logger.info(f"Wrote status to: {status_json.resolve()}")


if __name__ == "__main__":
    main()
