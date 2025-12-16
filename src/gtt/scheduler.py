import copy
import operator
from dataclasses import dataclass
from datetime import datetime
from functools import reduce
from typing import Any, Dict, List

# --- Model Configuration & Assumptions ---
DISCOUNT_RATE = 0.05
YEARS_OF_OPERATION = 60
AVG_PLANT_CAPACITY_MW = 1000
CAPACITY_FACTOR = 0.90
CURRENT_YEAR = datetime.now().year

TRL_PROBABILITY_MAP: Dict[str, float] = {
    "1": 0.10,
    "2": 0.20,
    "2-3": 0.25,
    "3": 0.30,
    "3-4": 0.40,
    "4": 0.50,
    "4-5": 0.60,
    "5": 0.70,
    "5-6": 0.75,
    "6": 0.80,
    "6-7": 0.85,
    "7": 0.90,
    "7-8": 0.95,
    "8": 0.98,
    "9": 1.0,
    "default": 0.6,
}

MWH_TO_TWH = 1_000_000


@dataclass
class Node:
    """
    A node in the tech tree graph.

    Represents milestones, enabling technologies, and reactor concepts with
    optional TRL metadata used to estimate initial time and risk.
    """
    id: str
    label: str
    type: str
    trl_current: str | None = None
    trl_projected_5_10_years: str | None = None


@dataclass(frozen=True)
class Edge:
    """
    Directed edge in the tech tree.

    Supports either a single target (target) or multiple targets (targets) to
    match the heterogeneous input formats seen in the data. Use targets_list()
    to iterate over resolved target IDs.
    """
    source: str
    target: str | None = None
    targets: list[str] | None = None

    def targets_list(self) -> list[str]:
        if self.targets:
            return [t for t in self.targets if t]
        return [self.target] if self.target else []


class NuclearScheduler:
    """
    A dynamic scheduler that simulates year-by-year progress and computes the
    marginal impact of accelerating each active milestone by one year.

    R&D work is modeled as reducing both time and risk; per-node impact is
    computed only over the reactor concepts reachable downstream of that node.
    """

    def __init__(self, graph_data: Dict[str, Any]):
        # Accept either legacy {graph:{nodes,edges}} or TS-like {nodes,edges}
        if "graph" in graph_data:
            nodes = graph_data["graph"]["nodes"]
            edges = graph_data["graph"]["edges"]
        else:
            nodes = graph_data["nodes"]
            edges = graph_data["edges"]

        # Normalize nodes to internal representation
        self.nodes: Dict[str, Dict[str, Any]] = {}
        for n in nodes:
            # Support both {id, label, type} and TS-like {id, data:{label,nodeLabel,...}}
            if "data" in n:
                label = n["data"].get("label", n.get("label", n["id"]))
                ntype = n["data"].get("nodeLabel", n.get("type", ""))
                trl_cur = n["data"].get("trl_current")
                trl_proj = n["data"].get("trl_projected_5_10_years")
            else:
                label = n.get("label", n["id"])  # type: ignore[index]
                ntype = n.get("type", "")
                trl_cur = n.get("trl_current")
                trl_proj = n.get("trl_projected_5_10_years")

            self.nodes[n["id"]] = {
                "id": n["id"],
                "label": label,
                "type": ntype,
                "trl_current": trl_cur,
                "trl_projected_5_10_years": trl_proj,
            }

        # Normalize edges to Edge dataclass
        edges_dc: list[Edge] = []
        for e in edges:
            try:
                source = e["source"]
                targets = e.get("targets")
                target = e.get("target")
            except Exception:
                # If already an Edge-like object
                source = getattr(e, "source")
                targets = getattr(e, "targets", None)
                target = getattr(e, "target", None)
            edges_dc.append(Edge(source=source, target=target, targets=targets))
        self.edges: list[Edge] = edges_dc

        self.dependencies = self._build_dependency_map()
        self.successors = self._build_successor_map()
        self.memoization_cache: Dict[str, tuple[float, float]] = {}
        self.recursion_stack: set[str] = set()

    @staticmethod
    def build_graph_from_techtree(tech_tree: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adapt a TS TechTree-like schema to the legacy Python scheduler schema.

        Params:
            tech_tree: Dict with keys "nodes" and "edges" where nodes include
                id and data.{label,nodeLabel,trl_current,trl_projected_5_10_years}.

        Returns:
            A dict shaped as {"graph": {"nodes": [...], "edges": [...]}} compatible
            with NuclearScheduler input.
        """
        return {
            "graph": {
                "nodes": [
                    {
                        "id": n["id"],
                        "label": n["data"].get("label", n["id"]),
                        "type": n["data"].get("nodeLabel", ""),
                        "trl_current": n["data"].get("trl_current"),
                        "trl_projected_5_10_years": n["data"].get(
                            "trl_projected_5_10_years"
                        ),
                    }
                    for n in tech_tree["nodes"]
                ],
                "edges": [
                    {
                        "source": e["source"],
                        # Allow either single target or multi-targets
                        "target": e.get("target"),
                        "targets": e.get("targets"),
                    }
                    for e in tech_tree["edges"]
                ],
            }
        }

    def _build_dependency_map(self) -> Dict[str, List[str]]:
        """Construct a mapping of node -> list of prerequisite node IDs.

        Returns:
            Dict where each key is a node id and the value is a list of ids that
            must be completed before the key node can start.
        """
        deps: Dict[str, List[str]] = {node_id: [] for node_id in self.nodes}
        for edge in self.edges:
            source_id = edge.source
            for target_id in edge.targets_list():
                if target_id in deps:
                    deps[target_id].append(source_id)
        return deps

    def _build_successor_map(self) -> Dict[str, List[str]]:
        """Construct a mapping of node -> list of immediate successor node IDs.

        Returns:
            Dict where each key is a node id and the value is the list of nodes
            that directly depend on it.
        """
        succ: Dict[str, List[str]] = {node_id: [] for node_id in self.nodes}
        for edge in self.edges:
            source_id = edge.source
            if source_id not in succ:
                # Skip edges whose source isn't a known node
                continue
            for target_id in edge.targets_list():
                if target_id:
                    succ[source_id].append(target_id)
        return succ

    def _get_downstream_concepts(self, start_node_id: str) -> List[str]:
        """Find all reactor concepts reachable downstream from a given start node."""
        concepts: set[str] = set()
        q: List[str] = [start_node_id]
        visited: set[str] = set()
        while q:
            curr_id = q.pop(0)
            if curr_id in visited:
                continue
            visited.add(curr_id)

            node = self.nodes.get(curr_id)
            if node and node.get("type") == "ReactorConcept":
                concepts.add(curr_id)

            for succ_id in self.successors.get(curr_id, []):
                if succ_id not in visited:
                    q.append(succ_id)
        return list(concepts)

    def _get_initial_prob(self, node: Dict[str, Any]) -> float:
        """Map a node's TRL string to an initial probability of success.

        Params:
            node: Node dict with optional key "trl_current".

        Returns:
            Probability in [0,1] using TRL_PROBABILITY_MAP with sensible defaults.
        """
        trl_str = (node.get("trl_current") or "default").strip()
        if " " in trl_str:
            trl_str = trl_str.split(" ")[0]
        if ";" in trl_str:
            trl_str = trl_str.split(";")[0].strip()
        return TRL_PROBABILITY_MAP.get(trl_str, TRL_PROBABILITY_MAP["default"])

    def _find_critical_path(
        self, node_id: str, current_nodes: Dict[str, Dict[str, Any]]
    ) -> tuple[float, float]:
        """Compute the critical-path time and success probability for a node.

        Depth-first traversal with memoization over prerequisites. Time is additive
        along the longest prerequisite chain; probability multiplies across independent
        prerequisites. If a cycle is detected, returns (inf, 0.0) for that path to
        avoid infinite recursion.

        Params:
            node_id: Target node identifier.
            current_nodes: Mutable node state mapping used during simulation.

        Returns:
            (total_time_years, total_prob_of_success)
        """
        if node_id in self.recursion_stack:
            return (float("inf"), 0.0)
        if node_id in self.memoization_cache:
            return self.memoization_cache[node_id]

        node = current_nodes.get(node_id)
        if not node:
            return 0.0, 1.0

        self.recursion_stack.add(node_id)

        time_for_this_node = float(node.get("time_remaining", 0))
        prob_of_this_node = float(node.get("prob_of_success", 1.0))

        prereq_ids = self.dependencies.get(node_id, [])
        if not prereq_ids:
            self.recursion_stack.remove(node_id)
            return time_for_this_node, prob_of_this_node

        prereq_times: List[float] = []
        prereq_probs: List[float] = []
        for prereq_id in prereq_ids:
            prereq_time, prereq_prob = self._find_critical_path(prereq_id, current_nodes)
            prereq_times.append(prereq_time)
            prereq_probs.append(prereq_prob)

        max_prereq_time = max(prereq_times) if prereq_times else 0.0
        combined_prereq_prob = reduce(operator.mul, prereq_probs, 1.0)

        total_time = time_for_this_node + max_prereq_time
        total_prob = prob_of_this_node * combined_prereq_prob

        self.recursion_stack.remove(node_id)
        self.memoization_cache[node_id] = (total_time, total_prob)
        return total_time, total_prob

    def _calculate_discounted_mwh(self, deployment_year: float) -> float:
        """Compute discounted MWh over plant lifetime given deployment year.

        Params:
            deployment_year: Calendar year when the reactor becomes operational.
                             Use inf to represent impossible deployment.

        Returns:
            Present-value MWh produced over YEARS_OF_OPERATION, discounted by
            DISCOUNT_RATE relative to CURRENT_YEAR.
        """
        if deployment_year == float("inf"):
            return 0.0
        annual_mwh = AVG_PLANT_CAPACITY_MW * CAPACITY_FACTOR * 24 * 365
        total_discounted_mwh = 0.0
        start_year = int(deployment_year)
        for i in range(YEARS_OF_OPERATION):
            year = start_year + i
            if year > CURRENT_YEAR:
                total_discounted_mwh += annual_mwh / ((1 + DISCOUNT_RATE) ** (year - CURRENT_YEAR))
        return total_discounted_mwh

    def _calculate_pathway_mwh(
        self, nodes_to_sim: Dict[str, Dict[str, Any]], concept_ids: List[str]
    ) -> float:
        """Calculate the total expected discounted MWh for a list of reactor concepts."""
        self.memoization_cache.clear()
        total_expected_mwh = 0.0
        for concept_id in concept_ids:
            time_to_deploy, prob_of_success = self._find_critical_path(concept_id, nodes_to_sim)
            deployment_year = CURRENT_YEAR + time_to_deploy
            potential_mwh = self._calculate_discounted_mwh(deployment_year)
            total_expected_mwh += potential_mwh * prob_of_success
        return total_expected_mwh

    def run_simulation(self, years_to_simulate: int = 20) -> tuple[dict, dict]:
        """
        Run a year-by-year scheduling simulation and compute per-node impacts.

        Allocates one unit of generic R&D effort uniformly across active nodes by
        advancing their time_remaining each year and reducing risk proportionally
        to their initial gap to success.

        Params:
            years_to_simulate: Number of years to simulate from CURRENT_YEAR.

        Returns:
            impact_table: {label -> {year -> impact_TWh}}
            status_table: {label -> {year -> "Pending"|"Active"|"Completed"}}
        """
        sim_nodes = copy.deepcopy(self.nodes)
        for node_id, node in sim_nodes.items():
            # Estimate initial time from TRL
            if node.get("trl_projected_5_10_years"):
                initial_time = 7.5
            else:
                try:
                    trl_token = str(node.get("trl_current", "1")).split("-")[0].split(" ")[0]
                    trl_val = float(trl_token)
                    initial_time = (9 - trl_val) * 2.5
                except Exception:
                    initial_time = 5.0

            node["initial_time"] = initial_time if initial_time > 0 else 0.1
            node["time_remaining"] = initial_time
            node["prob_of_success"] = self._get_initial_prob(node)
            node["is_complete"] = True if initial_time <= 0 else False

        impact_table: Dict[str, Dict[int, float]] = {
            node["label"]: {}
            for node in self.nodes.values()
            if node.get("type") in ["Milestone", "EnablingTechnology"]
        }
        status_table: Dict[str, Dict[int, str]] = {
            node["label"]: {}
            for node in self.nodes.values()
            if node.get("type") in ["Milestone", "EnablingTechnology"]
        }

        for year in range(CURRENT_YEAR, CURRENT_YEAR + years_to_simulate):
            # Update node progress/status
            for node_id, node in sim_nodes.items():
                if node.get("type") not in ["Milestone", "EnablingTechnology"]:
                    continue

                prereqs = self.dependencies.get(node_id, [])
                is_active = all(sim_nodes[pid].get("is_complete") for pid in prereqs)

                if node.get("is_complete"):
                    status_table[node["label"]][year] = "Completed"
                    continue

                if is_active:
                    status_table[node["label"]][year] = "Active"
                    if node["time_remaining"] > 0:
                        node["time_remaining"] -= 1
                        risk_reduction_per_year = (
                                                          1 - self._get_initial_prob(node)
                                                  ) / node["initial_time"]
                        node["prob_of_success"] += risk_reduction_per_year
                    if node["time_remaining"] <= 0:
                        node["is_complete"] = True
                        node["prob_of_success"] = 1.0
                else:
                    status_table[node["label"]][year] = "Pending"

            # Compute impact for active nodes only on their affected concepts
            for node_id, node in sim_nodes.items():
                if node.get("type") not in ["Milestone", "EnablingTechnology"]:
                    continue
                if node.get("is_complete"):
                    continue
                if status_table[node["label"]].get(year) != "Active":
                    continue

                affected_concepts = self._get_downstream_concepts(node_id)
                if not affected_concepts:
                    continue

                baseline_mwh = self._calculate_pathway_mwh(sim_nodes, affected_concepts)

                temp_nodes = copy.deepcopy(sim_nodes)
                temp_nodes[node_id]["time_remaining"] -= 1
                risk_reduction_per_year = (
                                                  1 - self._get_initial_prob(temp_nodes[node_id])
                                          ) / temp_nodes[node_id]["initial_time"]
                temp_nodes[node_id]["prob_of_success"] += risk_reduction_per_year

                accelerated_mwh = self._calculate_pathway_mwh(temp_nodes, affected_concepts)

                impact_twh = (accelerated_mwh - baseline_mwh) / MWH_TO_TWH
                if impact_twh > 1e-3:
                    impact_table[node["label"]][year] = impact_twh

        return impact_table, status_table
