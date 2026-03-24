import json

import pytest

import server.server as server_module


@pytest.fixture
def sample_analysis():
    return {
        "task": "Implement login",
        "complexity": 78,
        "compression": 40,
        "session_id": "oc_session_123",
        "can_remove": ["OAuth", "multi-tenant"],
        "analysis": {
            "intent": "Ship login fast",
            "assumptions": ["Need OAuth"],
            "facts": ["Internal app"],
            "reasoning": "OAuth can wait",
            "solution": "username/password + JWT",
        },
        "prompt": {
            "status": "updated",
            "delta": 12,
            "top_reasons": ["Added OAuth"],
            "deep_view_url": "http://127.0.0.1:5000/?session=oc_session_123",
        },
        "timestamp": "2026-03-24T00:00:00Z",
    }


def test_status_endpoint_returns_updated_state(sample_analysis):
    payload = server_module.build_status_payload(sample_analysis)

    assert payload["status"] == "updated"
    assert payload["session_id"] == "oc_session_123"
    assert payload["timestamp"] == "2026-03-24T00:00:00Z"


def test_prompt_endpoint_returns_prompt_payload(sample_analysis):
    payload = server_module.build_prompt_payload(sample_analysis)

    assert payload["status"] == "updated"
    assert payload["deep_view_url"].endswith("?session=oc_session_123")
    assert payload["task"] == "Implement login"
    assert payload["complexity"] == 78


@pytest.mark.parametrize(
    "action",
    ["accept", "dismiss"],
)
def test_action_endpoints_append_action_log(tmp_path, monkeypatch, action):
    actions_file = tmp_path / "actions.json"
    monkeypatch.setattr(server_module, "ACTIONS_FILE", actions_file)

    payload = server_module.append_action(action, "oc_session_123")
    actions = json.loads(actions_file.read_text(encoding="utf-8"))

    assert payload["action"] == action
    assert payload["session_id"] == "oc_session_123"
    assert actions[-1]["action"] == action
    assert actions[-1]["session_id"] == "oc_session_123"
