from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


def test_openclaw_setup_assets_exist():
    assert (BASE_DIR / "openclaw" / "bootstrap" / "FIRSTCLAW_MEMORY.md").exists()
    assert (BASE_DIR / "openclaw" / "config" / "hooks.example.json").exists()
    assert (BASE_DIR / "docs" / "OPENCLAW_SETUP.md").exists()


def test_install_script_mentions_openclaw_next_steps():
    content = (BASE_DIR / "install.sh").read_text(encoding="utf-8")

    assert "hooks.example.json" in content
    assert "OPENCLAW_SETUP.md" in content
    assert "Windows" in content or "macOS" in content
