import json
import threading
import urllib.request
from http.server import HTTPServer

import scripts.update_analysis as update_analysis_module
import server.server as server_module


def test_local_flow_exposes_prompt_and_actionable_ui(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    analysis_file = data_dir / "analysis.json"
    history_file = data_dir / "history.json"
    actions_file = data_dir / "actions.json"

    monkeypatch.setattr(update_analysis_module, "DATA_DIR", data_dir)
    monkeypatch.setattr(update_analysis_module, "ANALYSIS_FILE", analysis_file)
    monkeypatch.setattr(update_analysis_module, "HISTORY_FILE", history_file)

    monkeypatch.setattr(server_module, "DATA_DIR", data_dir)
    monkeypatch.setattr(server_module, "ACTIONS_FILE", actions_file)

    class Args:
        task = "Implement login"
        complexity = 78
        compression = 40
        can_remove = "OAuth,multi-tenant"
        intent = "Ship login fast"
        assumptions = "Need OAuth|Need multi-tenant"
        facts = "Internal app|Single team"
        reasoning = "Internal app does not need OAuth first"
        solution = "username/password + JWT"
        session_id = "oc_session_123"
        status = "updated"
        delta = 12
        top_reasons = "Added OAuth|Assumed multi-tenant"

    result = update_analysis_module.update_analysis(Args())

    assert result["prompt"]["status"] == "updated"
    assert result["prompt"]["deep_view_url"].endswith("?session=oc_session_123")

    httpd = HTTPServer(("127.0.0.1", 0), server_module.ClawHandler)
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()

    try:
      with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status") as response:
          status_payload = json.loads(response.read().decode("utf-8"))

      with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/prompt") as response:
          prompt_payload = json.loads(response.read().decode("utf-8"))

      with urllib.request.urlopen(f"http://127.0.0.1:{port}/") as response:
          html = response.read().decode("utf-8")
    finally:
      httpd.shutdown()
      httpd.server_close()
      thread.join(timeout=2)

    assert status_payload["status"] == "updated"
    assert prompt_payload["session_id"] == "oc_session_123"
    assert "接受建议" in html
    assert "忽略这次" in html
    assert "复制方案" in html
