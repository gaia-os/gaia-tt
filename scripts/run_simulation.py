"""
Run a very basic tech tree simulation and write results under scripts/data/simulations/.
"""
import argparse
import shutil
from pathlib import Path

from techtree.logger import log_to_file, logger
from techtree.simulator import save_results, simulate_chain

SEED = 101010
LOG_LEVEL = "INFO"  # Use string for our custom logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a minimal TechTree simulation")

    parser.add_argument("-d", "--draws", type=int, default=100, help="Number of Monte Carlo draws (default: 100)")
    parser.add_argument("-y", "--years", type=int, default=10, help="Years to simulate (default: 10)")
    parser.add_argument(
        "-n",
        "--name",
        type=str,
        default="latest",
        help="Run name (default: 'latest')",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    run_name = args.name
    base_dir = Path(__file__).parent / "data" / "simulations" / run_name
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
    results_json = base_dir / "results.json"
    log_out = base_dir / "log.out"
    log_to_file(log_out, level=LOG_LEVEL)

    # Minimal demo chain: two milestones leading to a single concept
    chain = [
        {"id": "m1", "label": "Milestone A", "type": "Milestone", "trl_current": "6"},
        {"id": "m2", "label": "Milestone B", "type": "Milestone", "trl_current": "5"},
        {"id": "c1", "label": "Concept 1", "type": "ReactorConcept"},
    ]
    logger.info(f"Running simulation with {len(chain)} nodes:")
    for node in chain:
        logger.info(f"  {node}")

    # Perform the sim
    impact = simulate_chain(chain, years_to_simulate=args.years, draws=args.draws, seed=SEED)

    save_results(impact, out_path=results_json)
    logger.info(f"Wrote simulation results to: {results_json.resolve()}")


if __name__ == "__main__":
    main()
