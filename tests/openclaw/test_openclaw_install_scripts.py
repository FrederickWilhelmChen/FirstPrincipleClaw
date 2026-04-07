from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


def test_openclaw_install_script_manages_control_ui_assets():
    script = (BASE_DIR / "scripts" / "openclaw_install.ts").read_text(encoding="utf-8")

    assert "firstclaw/control-ui" in script
    assert "gateway.controlUi.extraCss" in script
    assert "gateway.controlUi.extraJs" in script


def test_openclaw_uninstall_script_clears_extra_asset_config():
    script = (BASE_DIR / "scripts" / "openclaw_uninstall.ts").read_text(encoding="utf-8")

    assert "gateway.controlUi.extraCss" in script
    assert "gateway.controlUi.extraJs" in script
    assert "extensions" in script


def test_openclaw_install_script_manages_first_principle_agent_workspace():
    install_script = (BASE_DIR / "scripts" / "openclaw_install.ts").read_text(encoding="utf-8")
    uninstall_script = (BASE_DIR / "scripts" / "openclaw_uninstall.ts").read_text(encoding="utf-8")

    assert "first-principle" in install_script
    assert "workspace-first-principle" in install_script
    assert "agents" in install_script
    assert "agents.list[1].default" in install_script
    assert "first-principle" in uninstall_script
