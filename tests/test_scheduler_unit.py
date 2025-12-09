from __future__ import annotations

import copy
from typing import Dict, Any, List

import pytest

from techtree.scheduler import NuclearScheduler, CURRENT_YEAR


def multi_target_graph() -> Dict[str, Any]:
    """
    Build a small graph exercising prerequisites and multi-target edges:
    m1 ─┐
        ├─> et1 ──> {c1, c2}
    m2 ─┘
    """
    return {
        "nodes": [
            {"id": "m1", "label": "M1", "type": "Milestone", "trl_current": "6"},
            {"id": "m2", "label": "M2", "type": "Milestone", "trl_current": "5"},
            {"id": "et1", "label": "ET1", "type": "EnablingTechnology", "trl_current": "4"},
            {"id": "c1", "label": "Concept 1", "type": "ReactorConcept"},
            {"id": "c2", "label": "Concept 2", "type": "ReactorConcept"},
        ],
        "edges": [
            {"source": "m1", "target": "et1"},
            {"source": "m2", "target": "et1"},
            {"source": "et1", "targets": ["c1", "c2"]},
        ],
    }

def ts_like_graph() -> Dict[str, Any]:
    """
    Graph in the TS-like schema that should be accepted directly by NuclearScheduler.
    Mirrors the structure of `multi_target_graph`:
    m1 ─┐
         ├─> et1 ──> {c1, c2}
    m2 ─┘
    """
    return {
        "nodes": [
            {"id": "m1", "data": {"label": "M1", "nodeLabel": "Milestone", "trl_current": "6"}},
            {"id": "m2", "data": {"label": "M2", "nodeLabel": "Milestone", "trl_current": "5"}},
            {"id": "et1", "data": {"label": "ET1", "nodeLabel": "EnablingTechnology", "trl_current": "4"}},
            {"id": "c1", "data": {"label": "Concept 1", "nodeLabel": "ReactorConcept"}},
            {"id": "c2", "data": {"label": "Concept 2", "nodeLabel": "ReactorConcept"}},
        ],
        "edges": [
            {"source": "m1", "target": "et1"},
            {"source": "m2", "target": "et1"},
            {"source": "et1", "targets": ["c1", "c2"]},
        ],
    }

def test_dependency_and_successor_maps_multi_target():
    sched = NuclearScheduler(multi_target_graph())

    # Dependencies: et1 depends on m1 and m2; concepts depend on et1
    assert set(sched.dependencies["et1"]) == {"m1", "m2"}
    assert set(sched.dependencies["c1"]) == {"et1"}
    assert set(sched.dependencies["c2"]) == {"et1"}

    # Successors: m1 -> et1; m2 -> et1; et1 -> {c1, c2}
    assert sched.successors["m1"] == ["et1"]
    assert sched.successors["m2"] == ["et1"]
    assert set(sched.successors["et1"]) == {"c1", "c2"}


def test_downstream_concepts_bfs():
    sched = NuclearScheduler(multi_target_graph())

    assert set(sched._get_downstream_concepts("m1")) == {"c1", "c2"}
    assert set(sched._get_downstream_concepts("et1")) == {"c1", "c2"}
    assert set(sched._get_downstream_concepts("c1")) == {"c1"}


def test_critical_path_time_and_probability():
    sched = NuclearScheduler(multi_target_graph())

    # Craft node state for deterministic critical path calc
    nodes = copy.deepcopy(sched.nodes)
    nodes["m1"].update({"time_remaining": 2.0, "prob_of_success": 0.8})
    nodes["m2"].update({"time_remaining": 3.0, "prob_of_success": 0.9})
    nodes["et1"].update({"time_remaining": 5.0, "prob_of_success": 0.7})
    nodes["c1"].update({"time_remaining": 0.0, "prob_of_success": 1.0})

    # Critical path to concept 1 goes through et1 and the slower of m1/m2
    t, p = sched._find_critical_path("c1", nodes)
    assert t == pytest.approx(8.0, rel=1e-9, abs=1e-9)  # 5 + max(2,3)
    assert p == pytest.approx(0.504, rel=1e-9, abs=1e-9)  # 0.7 * 0.8 * 0.9


def test_critical_path_cycle_detection_returns_inf_zero():
    graph = {
        "nodes": [
            {"id": "a", "label": "A", "type": "Milestone"},
            {"id": "b", "label": "B", "type": "Milestone"},
        ],
        "edges": [
            {"source": "a", "target": "b"},
            {"source": "b", "target": "a"},  # cycle
        ],
    }
    sched = NuclearScheduler(graph)

    nodes = copy.deepcopy(sched.nodes)
    nodes["a"].update({"time_remaining": 1.0, "prob_of_success": 0.9})
    nodes["b"].update({"time_remaining": 1.0, "prob_of_success": 0.9})

    t, p = sched._find_critical_path("a", nodes)
    assert t == float("inf")
    assert p == 0.0


def test_discounted_mwh_behaviour():
    # Any graph works since we call the method directly
    sched = NuclearScheduler({"nodes": [], "edges": []})

    early = sched._calculate_discounted_mwh(CURRENT_YEAR + 5)
    later = sched._calculate_discounted_mwh(CURRENT_YEAR + 10)
    never = sched._calculate_discounted_mwh(float("inf"))

    assert early > later > 0
    assert never == 0.0


def test_run_simulation_status_transitions_basic():
    sched = NuclearScheduler(multi_target_graph())
    impact, status = sched.run_simulation(years_to_simulate=5)

    # Milestones should be Active each simulated year (no prereqs, not done yet)
    assert set(status["M1"].values()) == {"Active"}
    assert set(status["M2"].values()) == {"Active"}

    # Enabling tech must wait on both milestones and thus stays Pending in this horizon
    assert set(status["ET1"].values()) == {"Pending"}

    # Impact table may be sparse; when present, values are non-negative floats
    for yearly in impact.values():
        for y, val in yearly.items():
            assert isinstance(y, int)
            assert isinstance(val, (int, float))
            assert val >= 0


def test_init_accepts_ts_like_schema_directly():
    sched = NuclearScheduler(ts_like_graph())

    # Node labels/types are normalized from data.*
    assert sched.nodes["m1"]["label"] == "M1"
    assert sched.nodes["m1"]["type"] == "Milestone"
    assert sched.nodes["et1"]["label"] == "ET1"
    assert sched.nodes["et1"]["type"] == "EnablingTechnology"

    # Edges respect the multi-target structure m1,m2 -> et1 -> {c1,c2}
    assert sched.successors["m1"] == ["et1"]
    assert sched.successors["m2"] == ["et1"]
    assert set(sched.successors["et1"]) == {"c1", "c2"}

    # (Optional) Dependency checks for completeness
    assert set(sched.dependencies["et1"]) == {"m1", "m2"}
    assert set(sched.dependencies["c1"]) == {"et1"}
    assert set(sched.dependencies["c2"]) == {"et1"}