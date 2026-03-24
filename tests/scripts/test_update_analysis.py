from types import SimpleNamespace

import pytest

import scripts.update_analysis as update_analysis_module


def make_args(**overrides):
    base = {
        "task": "Implement login",
        "complexity": 78,
        "compression": 40,
        "can_remove": "OAuth,multi-tenant",
        "intent": "Ship a simple login flow",
        "assumptions": "Need SSO|Need multi-tenant",
        "facts": "Internal app|Single team",
        "reasoning": "Internal app does not need OAuth first",
        "solution": "username/password + JWT",
        "session_id": "oc_session_123",
        "status": "updated",
        "delta": 12,
        "top_reasons": "Added OAuth|Assumed multi-tenant",
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def configure_temp_storage(monkeypatch, tmp_path):
    data_dir = tmp_path / "data"
    analysis_file = data_dir / "analysis.json"
    history_file = data_dir / "history.json"
    monkeypatch.setattr(update_analysis_module, "DATA_DIR", data_dir)
    monkeypatch.setattr(update_analysis_module, "ANALYSIS_FILE", analysis_file)
    monkeypatch.setattr(update_analysis_module, "HISTORY_FILE", history_file)
    return analysis_file, history_file


def test_update_analysis_writes_prompt_metadata(tmp_path, monkeypatch):
    analysis_file, history_file = configure_temp_storage(monkeypatch, tmp_path)

    result = update_analysis_module.update_analysis(make_args())

    assert result["prompt"]["status"] == "updated"
    assert result["prompt"]["delta"] == 12
    assert result["prompt"]["top_reasons"] == [
        "Added OAuth",
        "Assumed multi-tenant",
    ]
    assert result["prompt"]["deep_view_url"] == "http://127.0.0.1:5000/?session=oc_session_123"
    assert result["session_id"] == "oc_session_123"
    assert analysis_file.exists()
    assert history_file.exists()


@pytest.mark.parametrize("field,value", [("complexity", -1), ("complexity", 101), ("compression", -1), ("compression", 101)])
def test_update_analysis_rejects_invalid_percentages(tmp_path, monkeypatch, field, value):
    configure_temp_storage(monkeypatch, tmp_path)
    args = make_args(**{field: value})

    with pytest.raises(ValueError, match="must be between 0 and 100"):
        update_analysis_module.update_analysis(args)


def test_update_analysis_handles_empty_session_id(tmp_path, monkeypatch):
    configure_temp_storage(monkeypatch, tmp_path)

    result = update_analysis_module.update_analysis(make_args(session_id=""))

    assert result["session_id"] == ""
    assert result["prompt"]["deep_view_url"] == "http://127.0.0.1:5000/"


def test_update_analysis_handles_empty_top_reasons(tmp_path, monkeypatch):
    configure_temp_storage(monkeypatch, tmp_path)

    result = update_analysis_module.update_analysis(make_args(top_reasons=""))

    assert result["prompt"]["top_reasons"] == []
