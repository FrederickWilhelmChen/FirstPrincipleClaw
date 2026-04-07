import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


def test_control_ui_asset_contract_uses_managed_relative_assets():
    js_path = BASE_DIR / "openclaw" / "control-ui" / "firstclaw-control-ui.js"
    content = js_path.read_text(encoding="utf-8")

    assert "./assets/current_guidance.json" in content


def test_firstclaw_plugin_schema_exposes_managed_output_paths():
    plugin_json_path = BASE_DIR / "plugins" / "firstclaw" / "openclaw.plugin.json"
    payload = json.loads(plugin_json_path.read_text(encoding="utf-8"))

    firstclaw = payload["configSchema"]["properties"]["firstclaw"]
    properties = firstclaw["properties"]

    assert properties["outputPath"]["type"] == "string"
    assert properties["mirrorOutputPath"]["type"] == "string"
