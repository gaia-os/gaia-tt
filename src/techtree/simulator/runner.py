import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import numpy as np

from techtree.logger import logger
from techtree.simulator.world_models import sample_milestone_duration, sample_reactor_twh_per_year


def simulate_chain(
    chain: List[Dict[str, Any]],
    years_to_simulate: int = 10,
    draws: int = 200,
    seed: int | None = 42,
) -> Dict[str, Dict[int, float]]:
    """
    Simulate a simple chain of dependent entities.

    Params:
        chain: Nodes in dependency order ending with a ReactorConcept. Each node
            is a dict with at least {id, label, type, trl_current?}.
        years_to_simulate: Number of years to simulate.
        draws: Number of Monte Carlo draws.
        seed: RNG seed for reproducibility.

    Returns:
        Mapping label -> {year -> expected TWh impact}. Status is trivial
        ('Active') for milestones in this minimal version.
    """
    logger.info(
        f"Simulating {len(chain)}-piece chain for {years_to_simulate} years at {draws} draws."
    )
    rng = np.random.default_rng(seed)

    # Identify milestones (all non-reactor except final node)
    if not chain:
        return {}

    reactor = chain[-1]
    milestones = [n for n in chain[:-1] if n.get("type") == "Milestone"]

    # Sample a deployment year based on sum of milestone durations
    milestone_durations = []
    for m in milestones:
        d = sample_milestone_duration(m, draws=draws, seed=rng.integers(0, 1_000_000))
        milestone_durations.append(d)
    if milestone_durations:
        total_duration_draws = np.sum(np.vstack(milestone_durations), axis=0)
    else:
        total_duration_draws = np.zeros(draws)

    # Sample annual TWh for the reactor
    twh_per_year_draws = sample_reactor_twh_per_year(draws=draws, seed=rng.integers(0, 1_000_000))

    current_year = datetime.now().year
    impact_data: Dict[str, Dict[int, float]] = {m["label"]: {} for m in milestones}

    for year in range(current_year, current_year + years_to_simulate):
        # Expected online indicator in this year for baseline
        years_since_start = year - current_year
        online_prob = np.mean(total_duration_draws <= years_since_start)
        expected_twh_this_year = online_prob * float(np.mean(twh_per_year_draws))

        # Attribute the expected TWh to all active milestones equally in this simple model
        active_milestones = milestones  # minimal: all milestones are considered active
        if active_milestones:
            per_milestone_twh = expected_twh_this_year / len(active_milestones)
            for m in active_milestones:
                impact_data[m["label"]][year] = per_milestone_twh

    return impact_data


def save_results(
    impact_data: Dict[str, Dict[int, float]],
    status_data: Dict[str, Dict[int, str]] | None = None,
    out_path: str | Path = "data/simulations/latest.json",
) -> Path:
    """
    Save results as a JSON object similar to the frontend expectation.

    Params:
        impact_data: Mapping label -> {year -> impact_TWh}.
        status_data: Optional mapping label -> {year -> status}.
        out_path: Output path for the JSON payload; parent dirs are created.

    Returns:
        Path to the written JSON file.
    """
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "impactData": impact_data,
        "statusData": status_data or {label: {} for label in impact_data.keys()},
    }
    out_path.write_text(json.dumps(payload, indent=2))
    return out_path
