#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mcs_techtree_runner.py
----------------------
CLI-compatible Monte Carlo Simulation runner for tech tree JSON files.

Usage:
    python mcs_techtree_runner.py <path_to_tech_tree.json> [--simulations 100] [--output-dir ./outputs]

GitHub Actions runs this nightly for any changed tech tree JSON files.
Results are written as JSON files to <output_dir>/<tree_name>/ for downstream dashboards.
"""

import argparse
import json
import os
import sys
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import qmc, triang, spearmanr, pearsonr
from tqdm import tqdm

# ---------------------------------------------------------------------------
# CLI argument parsing
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(description="Run MCS for a tech tree JSON file.")
    parser.add_argument("tech_tree_path", help="Path to the tech tree JSON file.")
    parser.add_argument(
        "--simulations", type=int, default=100,
        help="Number of Monte Carlo iterations (default: 100)."
    )
    parser.add_argument(
        "--output-dir", default="./outputs",
        help="Root output directory. Results go into <output-dir>/<tree_name>/."
    )
    parser.add_argument(
        "--simulation-module-path", default=".",
        help="Path to the directory containing simulation.py (NuclearScheduler)."
    )
    return parser.parse_args()

# ---------------------------------------------------------------------------
# Monte Carlo simulation helpers  (unchanged logic, extracted from notebook)
# ---------------------------------------------------------------------------

def monte_carlo_simulation(scheduler, option, NUM_SIMULATIONS):
    np.random.seed(24)
    result_impact_data_list = []
    result_status_data_list = []
    result_random_number_data_list = []
    x1_samples = None

    if option == 'option_1':
        np.random.seed(24)
        random_number_list = np.random.triangular(left=1.5, mode=2.5, right=3.5, size=NUM_SIMULATIONS).tolist()
        for random_number in tqdm(random_number_list, desc="Option 1"):
            impact_data, status_data, random_number_data, lhc_seed = scheduler.run_simulation(
                years_to_simulate=20, option=option, random_number=random_number
            )
            result_impact_data_list.append(impact_data)
            result_status_data_list.append(status_data)
            result_random_number_data_list.append(random_number_data)

    elif option == 'option_2':
        np.random.seed(24)
        for _ in tqdm(range(NUM_SIMULATIONS), desc="Option 2"):
            impact_data, status_data, random_number_data, lhc_seed = scheduler.run_simulation(
                years_to_simulate=20, option=option
            )
            result_impact_data_list.append(impact_data)
            result_status_data_list.append(status_data)
            result_random_number_data_list.append(random_number_data)

    elif option == 'option_3':
        min1, mode1, max1 = 1.5, 2.5, 3.5
        c1 = (mode1 - min1) / (max1 - min1)
        sampler1 = qmc.LatinHypercube(d=1, seed=42)
        random_number_list = sampler1.random(n=NUM_SIMULATIONS)
        x1_samples = triang.ppf(random_number_list, c=c1, loc=min1, scale=(max1 - min1)).tolist()
        lhc_seed = 1
        for [item1] in tqdm(x1_samples, desc="Option 3"):
            impact_data, status_data, random_number_data, lhc_seed = scheduler.run_simulation(
                years_to_simulate=20, option='option_3', random_number=item1, lhc_seed=lhc_seed
            )
            lhc_seed += 1
            result_impact_data_list.append(impact_data)
            result_status_data_list.append(status_data)
            result_random_number_data_list.append(random_number_data)

    return result_impact_data_list, result_status_data_list, result_random_number_data_list, x1_samples


def simulation_results_to_dataframe(result_impact_data_list, result_status_data_list,
                                    result_random_number_data_list, x1_samples):
    records_impact = [
        {'Iteration': i + 1, 'Node': node, 'Year': year, 'Value': value}
        for i, iteration in enumerate(result_impact_data_list)
        for node, years in iteration.items()
        for year, value in years.items()
    ]
    records_status = [
        {'Iteration': i + 1, 'Node': node, 'Year': year, 'Status': status}
        for i, iteration in enumerate(result_status_data_list)
        for node, years in iteration.items()
        for year, status in years.items()
    ]
    records_rng = [
        {'Iteration': i + 1, 'Node': node, 'Year': year, 'RandomNumber': rn}
        for i, iteration in enumerate(result_random_number_data_list)
        for node, years in iteration.items()
        for year, rn in years.items()
    ]
    df = pd.merge(pd.DataFrame(records_status), pd.DataFrame(records_impact),
                  on=["Iteration", "Node", "Year"], how="left")
    df = pd.merge(df, pd.DataFrame(records_rng),
                  on=["Iteration", "Node", "Year"], how="left")
    if x1_samples:
        rn_map = {i + 1: x1_samples[i][0] for i in range(len(x1_samples))}
        df['YearsPerTRL'] = df['Iteration'].map(rn_map)
    return df


def main_run_mcs(scheduler, option, NUM_SIMULATIONS):
    result_impact, result_status, result_rng, x1_samples = monte_carlo_simulation(
        scheduler, option=option, NUM_SIMULATIONS=NUM_SIMULATIONS
    )
    df = simulation_results_to_dataframe(result_impact, result_status, result_rng, x1_samples)
    if option == 'option_1':
        df.rename(columns={"RandomNumber": "YearsPerTRL"}, inplace=True)
    elif option in ('option_2', 'option_3'):
        df.rename(columns={"RandomNumber": "RandomDelay"}, inplace=True)
    return df

# ---------------------------------------------------------------------------
# Stats & risk helpers (unchanged logic)
# ---------------------------------------------------------------------------

def calculate_stats_for_all_nodes(df, random_number_column, scheduler, tech_tree):
    data_completed = df[df['Status'] == 'Completed']
    if random_number_column == 'CombinedUncertainty':
        data_completed_years = (
            data_completed
            .groupby(['Node', 'Iteration'])[['Year', 'RandomDelay', 'YearsPerTRL']]
            .first().reset_index()
        )
    else:
        data_completed_years = (
            data_completed
            .groupby(['Node', 'Iteration'])[['Year', random_number_column]]
            .first().reset_index()
        )

    stats = (data_completed_years
             .groupby('Node')['Year']
             .agg(mean='mean', median='median', min='min', max='max', std='std',
                  span=lambda x: x.max() - x.min(),
                  q05=lambda x: x.quantile(0.05), q25=lambda x: x.quantile(0.25),
                  q75=lambda x: x.quantile(0.75), q95=lambda x: x.quantile(0.95))
             .fillna({'std': 0})
             .reset_index())

    label_node_mapper = {node["label"]: node["id"] for node in tech_tree["graph"]["nodes"]}
    dep = scheduler.dependencies
    succ = scheduler.successors
    stats['dep_count'] = stats['Node'].map(lambda lbl: len(dep.get(label_node_mapper.get(lbl, ''), [])))
    stats['dep'] = stats['Node'].map(lambda lbl: dep.get(label_node_mapper.get(lbl, ''), []))
    stats['succ_count'] = stats['Node'].map(lambda lbl: len(succ.get(label_node_mapper.get(lbl, ''), [])))
    stats['succ'] = stats['Node'].map(lambda lbl: succ.get(label_node_mapper.get(lbl, ''), []))
    return data_completed_years, stats


def classify_5_levels(series):
    min_val, max_val = series.min(), series.max()
    if min_val == max_val:
        return pd.Series(1, index=series.index)
    bins = np.linspace(min_val, max_val, 6)
    return pd.cut(series, bins=bins, labels=[1, 2, 3, 4, 5], include_lowest=True).astype(int)


def main_run_risk_assessment(stats):
    dep_map = {0: 1, 1: 3, 2: 5}
    evaluation = stats[["Node", "std", "q95", "median", "dep_count", "succ_count", "span"]].copy()
    evaluation["std_class"] = classify_5_levels(evaluation["std"])
    evaluation["Tail_Risiko"] = classify_5_levels(evaluation["q95"] - evaluation["median"])
    evaluation["succ_count_class"] = classify_5_levels(evaluation["succ_count"])
    evaluation["dep_count_class"] = evaluation["dep_count"].map(dep_map)
    evaluation["span_class"] = classify_5_levels(evaluation["span"])
    evaluation["Score"] = evaluation[
        ["std_class", "Tail_Risiko", "succ_count_class", "dep_count_class", "span_class"]
    ].mean(axis=1)
    return evaluation[["Node", "std_class", "Tail_Risiko", "succ_count_class",
                        "dep_count_class", "span_class", "Score"]]


def node_sensitivity_analysis(data_completed_years, stats):
    sensitivity_cols = ["YearsPerTRL", "RandomDelay"]
    results = []
    for node in stats["Node"]:
        node_data = data_completed_years[data_completed_years["Node"] == node]
        if len(node_data) < 3:
            continue
        row = {"Node": node, "n_obs": len(node_data)}
        for col in sensitivity_cols:
            if col not in node_data.columns:
                row[f"{col}_rho"] = None
                row[f"{col}_p"] = None
                continue
            rho, p_value = spearmanr(node_data[col], node_data["Year"])
            row[f"{col}_rho"] = rho
            row[f"{col}_p"] = p_value
        results.append(row)
    return pd.DataFrame(results)

# ---------------------------------------------------------------------------
# JSON output helpers
# ---------------------------------------------------------------------------

def _df_to_records(df):
    """Convert a DataFrame to a JSON-serialisable list of dicts."""
    return json.loads(df.to_json(orient="records"))


def save_stats_json(stats, path):
    """Per-node summary statistics (mean, median, std, quantiles, span, dep/succ counts)."""
    # Drop list columns (dep, succ) — they can be large and are in the tech tree JSON already
    exportable = stats.drop(columns=["dep", "succ"], errors="ignore")
    with open(path, "w") as f:
        json.dump(_df_to_records(exportable), f, indent=2)


def save_simulation_runs_json(data_completed_years, path):
    """Raw per-iteration completion years — used for histogram / distribution plots."""
    with open(path, "w") as f:
        json.dump(_df_to_records(data_completed_years), f, indent=2)


def save_risk_assessment_json(evaluation, path):
    """Risk criteria classes and composite score per node — used for heatmap / spider charts."""
    with open(path, "w") as f:
        json.dump(_df_to_records(evaluation), f, indent=2)


def save_sensitivity_json(node_sensitivity_df, path):
    """Spearman correlations per node for YearsPerTRL and RandomDelay."""
    with open(path, "w") as f:
        json.dump(_df_to_records(node_sensitivity_df), f, indent=2)


def save_metadata_json(tech_tree_path, NUM_SIMULATIONS, tree_name, path):
    """Run provenance — timestamp, source file, git commit, settings."""
    try:
        git_hash = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        git_hash = "unknown"

    with open(tech_tree_path, "rb") as f:
        file_hash = hashlib.md5(f.read()).hexdigest()

    metadata = {
        "tree_name": tree_name,
        "source_file": str(tech_tree_path),
        "file_md5": file_hash,
        "git_commit": git_hash,
        "run_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "num_simulations": NUM_SIMULATIONS,
        "simulation_option": "option_3",  # primary option used for dashboard outputs
    }
    with open(path, "w") as f:
        json.dump(metadata, f, indent=2)

# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    tech_tree_path = Path(args.tech_tree_path)
    if not tech_tree_path.exists():
        print(f"ERROR: tech tree file not found: {tech_tree_path}", file=sys.stderr)
        sys.exit(1)

    NUM_SIMULATIONS = args.simulations

    # Derive a clean output folder name from the filename (e.g. "nuclear" from "nuclear.json")
    tree_name = tech_tree_path.stem
    output_dir = Path(args.output_dir) / tree_name
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"[{tree_name}] Loading tech tree from {tech_tree_path}")
    with open(tech_tree_path, "r") as f:
        tech_tree = json.load(f)

    # Add simulation module to path and import scheduler
    sys.path.append(str(Path(args.simulation_module_path).resolve()))
    from simulation import NuclearScheduler  # noqa: E402

    scheduler = NuclearScheduler(tech_tree)

    # --- Run all three options (option_3 is primary; 1 & 2 kept for comparison outputs) ---
    print(f"[{tree_name}] Running Option 1 ({NUM_SIMULATIONS} simulations)...")
    np.random.seed(24)
    df_o1 = main_run_mcs(scheduler, option='option_1', NUM_SIMULATIONS=NUM_SIMULATIONS)

    print(f"[{tree_name}] Running Option 2 ({NUM_SIMULATIONS} simulations)...")
    np.random.seed(24)
    df_o2 = main_run_mcs(scheduler, option='option_2', NUM_SIMULATIONS=NUM_SIMULATIONS)

    print(f"[{tree_name}] Running Option 3 ({NUM_SIMULATIONS} simulations, LHS)...")
    np.random.seed(24)
    df_o3 = main_run_mcs(scheduler, option='option_3', NUM_SIMULATIONS=NUM_SIMULATIONS)

    # --- Compute stats for all three options ---
    data_completed_o1, stats_o1 = calculate_stats_for_all_nodes(df_o1, "YearsPerTRL", scheduler, tech_tree)
    data_completed_o2, stats_o2 = calculate_stats_for_all_nodes(df_o2, "RandomDelay", scheduler, tech_tree)
    data_completed_o3, stats_o3 = calculate_stats_for_all_nodes(df_o3, "CombinedUncertainty", scheduler, tech_tree)

    # --- Risk assessment ---
    eval_o1 = main_run_risk_assessment(stats_o1)
    eval_o2 = main_run_risk_assessment(stats_o2)
    eval_o3 = main_run_risk_assessment(stats_o3)

    # --- Sensitivity analysis (option 3 only — has both columns) ---
    sensitivity_df = node_sensitivity_analysis(data_completed_o3, stats_o3)

    # --- Save all outputs ---
    print(f"[{tree_name}] Saving outputs to {output_dir}/")

    # stats.json — one file per option
    save_stats_json(stats_o1, output_dir / "stats_option1.json")
    save_stats_json(stats_o2, output_dir / "stats_option2.json")
    save_stats_json(stats_o3, output_dir / "stats_option3.json")

    # simulation_runs.json — raw per-iteration completion years per option
    save_simulation_runs_json(data_completed_o1, output_dir / "simulation_runs_option1.json")
    save_simulation_runs_json(data_completed_o2, output_dir / "simulation_runs_option2.json")
    save_simulation_runs_json(data_completed_o3, output_dir / "simulation_runs_option3.json")

    # risk_assessment.json — per option
    save_risk_assessment_json(eval_o1, output_dir / "risk_assessment_option1.json")
    save_risk_assessment_json(eval_o2, output_dir / "risk_assessment_option2.json")
    save_risk_assessment_json(eval_o3, output_dir / "risk_assessment_option3.json")

    # sensitivity.json — option 3 only
    save_sensitivity_json(sensitivity_df, output_dir / "sensitivity.json")

    # metadata.json
    save_metadata_json(tech_tree_path, NUM_SIMULATIONS, tree_name, output_dir / "metadata.json")

    print(f"[{tree_name}] Done. Output files:")
    for p in sorted(output_dir.iterdir()):
        print(f"  {p}")


if __name__ == "__main__":
    main()