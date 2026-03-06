import json
import copy
from datetime import datetime
import sys
from functools import reduce
import operator
import numpy as np
from scipy.stats import qmc, triang
sys.setrecursionlimit(2000)

# --- Model Configuration & Assumptions ---
DISCOUNT_RATE = 0.05
YEARS_OF_OPERATION = 60
AVG_PLANT_CAPACITY_MW = 1000
CAPACITY_FACTOR = 0.90
CURRENT_YEAR = datetime.now().year
TRL_PROBABILITY_MAP = {
    "1": 0.10, "2": 0.20, "2-3": 0.25, "3": 0.30, "3-4": 0.40,
    "4": 0.50, "4-5": 0.60, "5": 0.70, "5-6": 0.75, "6": 0.80,
    "6-7": 0.85, "7": 0.90, "7-8": 0.95, "8": 0.98, "9": 1.0,
    "default": 0.6
}
MWH_TO_TWH = 1_000_000

class NuclearScheduler:
    """
    A dynamic scheduler that simulates year-by-year progress and allocates
    acceleration resources to the highest-impact milestones.
    This version correctly models that R&D work reduces both time and risk,
    and correctly calculates impact based on affected pathways only.
    """
    def __init__(self, graph_data):
        self.nodes = {node['id']: node for node in graph_data['graph']['nodes']}
        self.edges = graph_data['graph']['edges']
        self.dependencies = self._build_dependency_map()
        self.successors = self._build_successor_map()
        self.memoization_cache = {}
        self.recursion_stack = set()

    def _build_dependency_map(self):
        deps = {node_id: [] for node_id in self.nodes}
        for edge in self.edges:
            source_id = edge['source']
            targets = edge.get('targets', [edge.get('target')])
            for target_id in targets:
                if target_id and target_id in deps:
                    deps[target_id].append(source_id)
        return deps

    def _build_successor_map(self):
        succ = {node_id: [] for node_id in self.nodes}
        for edge in self.edges:
            source_id = edge['source']
            targets = edge.get('targets', [edge.get('target')])
            for target_id in targets:
                 if source_id and source_id in succ:
                    succ[source_id].append(target_id)
        return succ

    def _get_downstream_concepts(self, start_node_id):
        """Find all final reactor concepts that depend on a given start node."""
        concepts = set()
        q = [start_node_id]
        visited = set()
        while q:
            curr_id = q.pop(0)
            if curr_id in visited:
                continue
            visited.add(curr_id)

            node = self.nodes.get(curr_id)
            if node and node.get('type') == 'ReactorConcept':
                concepts.add(curr_id)

            for succ_id in self.successors.get(curr_id, []):
                if succ_id not in visited:
                    q.append(succ_id)
        return list(concepts)

    def _get_initial_prob(self, node):
        trl_str = node.get('trl_current', 'default')
        if ' ' in trl_str: trl_str = trl_str.split(' ')[0]
        if ';' in trl_str: trl_str = trl_str.split(';')[0].strip()
        return TRL_PROBABILITY_MAP.get(trl_str, TRL_PROBABILITY_MAP['default'])

    def _find_critical_path(self, node_id, current_nodes):
        if node_id in self.recursion_stack: return (float('inf'), 0.0)
        if node_id in self.memoization_cache: return self.memoization_cache[node_id]

        node = current_nodes.get(node_id)
        if not node: return 0, 1.0

        self.recursion_stack.add(node_id)

        time_for_this_node = node.get('time_remaining', 0)
        prob_of_this_node = node.get('prob_of_success', 1.0)

        prereq_ids = self.dependencies.get(node_id, [])
        if not prereq_ids:
            self.recursion_stack.remove(node_id)
            return time_for_this_node, prob_of_this_node

        prereq_times = []
        prereq_probs = []
        for prereq_id in prereq_ids:
            prereq_time, prereq_prob = self._find_critical_path(prereq_id, current_nodes)
            prereq_times.append(prereq_time)
            prereq_probs.append(prereq_prob)

        max_prereq_time = max(prereq_times) if prereq_times else 0.0
        combined_prereq_prob = reduce(operator.mul, prereq_probs, 1)

        total_time = time_for_this_node + max_prereq_time
        total_prob = prob_of_this_node * combined_prereq_prob

        self.recursion_stack.remove(node_id)
        self.memoization_cache[node_id] = (total_time, total_prob)
        return total_time, total_prob

    def _calculate_discounted_mwh(self, deployment_year):
        if deployment_year == float('inf'): return 0
        annual_mwh = AVG_PLANT_CAPACITY_MW * CAPACITY_FACTOR * 24 * 365
        total_discounted_mwh = sum(
            annual_mwh / ((1 + DISCOUNT_RATE) ** (deployment_year + i - CURRENT_YEAR))
            for i in range(YEARS_OF_OPERATION) if deployment_year + i > CURRENT_YEAR
        )
        return total_discounted_mwh

    def _calculate_pathway_mwh(self, nodes_to_sim, concept_ids):
        """Calculates the total expected MWh for a specific list of concepts."""
        self.memoization_cache.clear()
        total_expected_mwh = 0
        for concept_id in concept_ids:
            time_to_deploy, prob_of_success = self._find_critical_path(concept_id, nodes_to_sim)
            deployment_year = CURRENT_YEAR + time_to_deploy
            potential_mwh = self._calculate_discounted_mwh(deployment_year)
            total_expected_mwh += potential_mwh * prob_of_success
        return total_expected_mwh

    # Hauptfunktion für die Simulation. Paramter:
    # - years_to_simulate: Anzahl der Jahre, die simuliert werden sollen
    # - option: Gibt an, welche Parameter simuliert werden sollen (global, lokal, beide oder keine)
    # - random_number: Ein zufälliger Wert, der für die Simulation verwendet wird (für option_1 und option_3)
    # - lhc_seed: Ein Seed-Wert für die Latin Hypercube Sampling Methode (nur für option_3)
    def run_simulation(self, years_to_simulate=20, option=None, random_number=None, lhc_seed=None):
        sim_nodes = copy.deepcopy(self.nodes)

        # Hilfsdictionary, um die generierten Zufallszahlen für jede Node zu speichern
        helper_dict_random_number = {}

        # Definiere die Parameter der Dreiecksverteilung für lokale Zufallswerte (nur für Option 3)
        if option == 'option_3':
            # Parameter der Dreiecksverteilung für lokale Zufallswerte
            min2, mode2, max2 = 0.0, 2.0, 5.0
            c2 = (mode2 - min2) / (max2 - min2)
            # Initialisiere LHS-Sampler: d=1 für eindimensionale Stichproben, seed für Reproduzierbarkeit
            sampler2 = qmc.LatinHypercube(d=1, seed=lhc_seed)

        for node_id, node in sim_nodes.items():

            initial_time = 0

            if 'trl_projected_5_10_years' in node:
                initial_time = 7.5
            else:
                try:
                    trl_val = float(node.get('trl_current', '1').split('-')[0].split(' ')[0])
                    # Option 1: Globaler Zufallswert für alle Nodes
                    if option == 'option_1':
                        initial_time = (9 - trl_val) * random_number
                        helper_dict_random_number.update({node['label']: random_number})

                    # Option 2: Lokaler Zufallswert für jede Node
                    elif option == 'option_2':
                        random_number = np.random.triangular(left=0, mode=2, right=5)
                        initial_time = ((9 - trl_val) * 2.5) + random_number
                        helper_dict_random_number.update({node['label']: random_number})

                    # Option 3: Globaler Zufallswert für alle Nodes und zusätzlich lokale Zufallswerte
                    elif option == 'option_3':

                        # Erhöhe den LHC-Seed für die nächste Node, um unterschiedliche Stichproben zu erhalten
                        # lhc_seed += 1

                        # Ziehe eine uniforme Stichproben; ravel() flacht das Ergebnis zu einem 1D-Array ab
                        random_number_list2 = sampler2.random(n=1) #.ravel()
                        x2_sample = triang.ppf(random_number_list2[0], c2, loc=min2, scale=(max2 - min2))

                        # Berechne die initiale Zeit basierend auf dem TRL-Wert und der gezogenen Stichprobe
                        initial_time = ((9 - trl_val) * random_number) + x2_sample[0]
                        helper_dict_random_number.update({node['label']: x2_sample[0]})

                    else:
                        initial_time = (9 - trl_val) * 2.5

                except (ValueError, IndexError):
                    initial_time = 5.0

            node['initial_time'] = initial_time if initial_time > 0 else 0.1 # Avoid division by zero
            node['time_remaining'] = initial_time
            node['prob_of_success'] = self._get_initial_prob(node)
            node['is_complete'] = True if initial_time <= 0 else False

        # Initialisieren von Dictionaries für die Speicherung von Impacts, Status und Zufallszahlen für alle Milestone und EnablingTechnology Nodes für jedes Jahr der Simulation.
        impact_table = {node['label']: {} for node in self.nodes.values() if node.get('type') in ['Milestone', 'EnablingTechnology']}
        status_table = {node['label']: {} for node in self.nodes.values() if node.get('type') in ['Milestone', 'EnablingTechnology']}
        random_number_table = {node['label']: {} for node in self.nodes.values() if node.get('type') in ['Milestone', 'EnablingTechnology']}

        for year in range(CURRENT_YEAR, CURRENT_YEAR + years_to_simulate):
            for node_id, node in sim_nodes.items():

                if node.get('type') not in ['Milestone', 'EnablingTechnology']: continue

                prereqs = self.dependencies.get(node_id, [])
                is_active = all(sim_nodes[pid]['is_complete'] for pid in prereqs)

                if node['is_complete']:
                    status_table[node['label']][year] = "Completed"
                    continue

                if is_active:
                    status_table[node['label']][year] = "Active"
                    if node['time_remaining'] > 0:
                        node['time_remaining'] -= 1
                        risk_reduction_per_year = (1 - self._get_initial_prob(node)) / node['initial_time']
                        node['prob_of_success'] += risk_reduction_per_year
                    if node['time_remaining'] <= 0:
                        node['is_complete'] = True
                        node['prob_of_success'] = 1.0
                else:
                    status_table[node['label']][year] = "Pending"

            for node_id, node in sim_nodes.items():
                if node.get('type') not in ['Milestone', 'EnablingTechnology']: continue
                if node['is_complete']: continue
                if status_table[node['label']].get(year) == "Active":
                    # Find all final concepts affected by this node
                    affected_concepts = self._get_downstream_concepts(node_id)
                    if not affected_concepts: continue

                    # Calculate baseline MWh for only the affected concepts
                    baseline_mwh = self._calculate_pathway_mwh(sim_nodes, affected_concepts)

                    temp_nodes = copy.deepcopy(sim_nodes)

                    # Apply acceleration (time and risk reduction)
                    temp_nodes[node_id]['time_remaining'] -= 1
                    risk_reduction_per_year = (1 - self._get_initial_prob(temp_nodes[node_id])) / temp_nodes[node_id]['initial_time']
                    temp_nodes[node_id]['prob_of_success'] += risk_reduction_per_year

                    # Calculate accelerated MWh for only the affected concepts
                    accelerated_mwh = self._calculate_pathway_mwh(temp_nodes, affected_concepts)

                    impact_twh = (accelerated_mwh - baseline_mwh) / MWH_TO_TWH
                    if impact_twh > 0.001:
                        impact_table[node['label']][year] = impact_twh

            for node_id, node in sim_nodes.items():
                if node.get('type') not in ['Milestone', 'EnablingTechnology']: continue

                # Speichern der generierten Zufallszahlen für jede Node in der random_number_table für jedes Jahr der Simulation.
                random_number_table[node['label']][year] = helper_dict_random_number.get(node['label'], None)

        # Rückgabe der Impact-Tabelle, Status-Tabelle, Zufallszahlentabelle und des LHC-Seeds (falls verwendet) am Ende der Simulation.
        return impact_table, status_table, random_number_table, lhc_seed