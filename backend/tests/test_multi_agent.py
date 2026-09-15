from app.ml.multi_agent import evaluate_interactions, generate_scenario


def test_failure_in_a002_reports_downstream_dependency_without_promoting_a003():
    events = generate_scenario("failure_cascade")
    result = evaluate_interactions(events)

    assert result["failed_agents"] == ["A002", "A003"]
    assert result["observed_anomalous_agents"] == ["A002"]
    assert result["downstream_dependent_agents"] == ["A003"]
    assert result["observed_cascade"] is True
    assert result["causal_inference"] is False


def test_normal_workflow_preserves_session_and_parent_edges():
    events = generate_scenario("normal_workflow")

    assert {event.session_id for event in events} == {"S-workflow"}
    assert [(event.agent_id, event.parent_agent_id) for event in events] == [
        ("A001", None),
        ("A002", "A001"),
        ("A003", "A002"),
    ]
