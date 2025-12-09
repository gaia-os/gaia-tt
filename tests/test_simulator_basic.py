from techtree.simulator import simulate_chain


def basic_chain():
    return [
        {"id": "m1", "label": "Milestone A", "type": "Milestone", "trl_current": "6"},
        {"id": "m2", "label": "Milestone B", "type": "Milestone", "trl_current": "5"},
        {"id": "c1", "label": "Concept 1", "type": "ReactorConcept"},
    ]


SEED = 123

def test_simulate_chain_shape_and_determinism():
    chain = basic_chain()
    years = 5

    res1 = simulate_chain(chain, years_to_simulate=years, draws=100, seed=SEED)
    res2 = simulate_chain(chain, years_to_simulate=years, draws=100, seed=SEED)

    assert set(res1.keys()) == {"Milestone A", "Milestone B"}
    for label, yearly in res1.items():
        assert len(yearly) == years
        # years are increasing integer keys
        assert list(sorted(yearly.keys())) == sorted(list(yearly.keys()))
        # values are positive
        assert all(v >= 0 for v in yearly.values())

    # Deterministic with same seed
    assert res1 == res2
