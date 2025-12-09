import os
from techtree.scheduler import NuclearScheduler


def make_min_graph():
    return {
        "graph": {
            "nodes": [
                {"id": "m1", "label": "Milestone A", "type": "Milestone", "trl_current": "5"},
                {"id": "c1", "label": "Concept 1", "type": "ReactorConcept", "trl_current": "7"},
            ],
            "edges": [
                {"source": "m1", "target": "c1"},
            ],
        }
    }


def test_scheduler_run_simulation_structure():
    sched = NuclearScheduler(make_min_graph())
    impact, status = sched.run_simulation(years_to_simulate=3)

    # Structure checks
    assert isinstance(impact, dict)
    assert isinstance(status, dict)

    # Milestone label should appear in both tables
    assert "Milestone A" in impact
    assert "Milestone A" in status

    # Years should be integer-like keys when present
    for k, v in status.items():
        for year, label in v.items():
            assert isinstance(year, int)
            assert label in {"Pending", "Active", "Completed"}

    # Impact values should be non-negative floats when present
    for k, v in impact.items():
        for year, val in v.items():
            assert isinstance(year, int)
            assert isinstance(val, (int, float))
            assert val >= 0
