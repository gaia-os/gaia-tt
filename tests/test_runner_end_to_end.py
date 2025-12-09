from pathlib import Path
import json

from techtree.simulator import simulate_chain, save_results


def test_save_results_json(tmp_path: Path):
    chain = [
        {"id": "m1", "label": "Milestone A", "type": "Milestone", "trl_current": "6"},
        {"id": "c1", "label": "Concept 1", "type": "ReactorConcept"},
    ]
    impact = simulate_chain(chain, years_to_simulate=3, draws=50, seed=7)

    out_file = tmp_path / "sim" / "out.json"
    path = save_results(impact, out_path=out_file)

    assert path.exists()
    payload = json.loads(path.read_text())
    assert "impactData" in payload
    assert "statusData" in payload

    # Basic shape
    assert set(payload["impactData"].keys()) == {"Milestone A"}
    assert isinstance(payload["statusData"], dict)
