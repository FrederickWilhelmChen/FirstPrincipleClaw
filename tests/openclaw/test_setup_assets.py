from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


def test_openclaw_setup_assets_exist():
    assert (BASE_DIR / "openclaw" / "bootstrap" / "FIRSTCLAW_MEMORY.md").exists()
    assert (BASE_DIR / "openclaw" / "control-ui" / "firstclaw-control-ui.js").exists()
    assert (BASE_DIR / "openclaw" / "control-ui" / "firstclaw-control-ui.css").exists()
    assert (BASE_DIR / "openclaw" / "config" / "hooks.example.json").exists()
    assert (BASE_DIR / "plugins" / "firstclaw" / "openclaw.plugin.json").exists()
    assert (BASE_DIR / "plugins" / "firstclaw" / "index.ts").exists()
    assert (BASE_DIR / "plugins" / "firstclaw" / "src" / "write_guidance_state_tool.ts").exists()
    assert (BASE_DIR / "scripts" / "openclaw_install.ts").exists()
    assert (BASE_DIR / "scripts" / "openclaw_uninstall.ts").exists()
    assert (BASE_DIR / "docs" / "OPENCLAW_SETUP.md").exists()


def test_bootstrap_and_agent_workspace_prompts_are_chinese():
    bootstrap = (BASE_DIR / "openclaw" / "bootstrap" / "FIRSTCLAW_MEMORY.md").read_text(encoding="utf-8")
    soul = (BASE_DIR / "openclaw" / "agent-workspace" / "SOUL.md").read_text(encoding="utf-8")
    memory = (BASE_DIR / "openclaw" / "agent-workspace" / "MEMORY.md").read_text(encoding="utf-8")

    assert "你是" in bootstrap
    assert "OpenClaw" in bootstrap
    assert "你是" in soul
    assert "中文" in memory


def test_openclaw_workspace_restores_hard_gate_prompting():
    agents = (BASE_DIR / "openclaw" / "agent-workspace" / "AGENTS.md").read_text(encoding="utf-8")
    memory = (BASE_DIR / "openclaw" / "agent-workspace" / "MEMORY.md").read_text(encoding="utf-8")
    bootstrap = (BASE_DIR / "openclaw" / "bootstrap" / "FIRSTCLAW_MEMORY.md").read_text(encoding="utf-8")

    assert "<HARD-GATE>" in memory
    assert "NON-NEGOTIABLE" in memory
    assert "write_guidance_state" in memory
    assert "先调用一次" in memory
    assert "跳过" in memory
    assert "回复视为无效" in memory
    assert "硬门槛" in agents
    assert "必须先完成结构化写入" in bootstrap


def test_openclaw_workspace_preserves_scope_across_follow_up_turns():
    agents = (BASE_DIR / "openclaw" / "agent-workspace" / "AGENTS.md").read_text(encoding="utf-8")
    memory = (BASE_DIR / "openclaw" / "agent-workspace" / "MEMORY.md").read_text(encoding="utf-8")
    bootstrap = (BASE_DIR / "openclaw" / "bootstrap" / "FIRSTCLAW_MEMORY.md").read_text(encoding="utf-8")

    assert "同一 session" in memory
    assert "默认视为对当前任务的补充、约束追加或范围澄清" in memory
    assert "除非用户明确改题" in memory
    assert "不得只围绕最后一句话重算整个任务" in memory
    assert "不要把补充条件误判成任务缩小" in agents
    assert "后续补充默认继承当前任务范围" in bootstrap


def test_install_script_mentions_openclaw_next_steps():
    content = (BASE_DIR / "install.sh").read_text(encoding="utf-8")

    assert "hooks.example.json" in content
    assert "OPENCLAW_SETUP.md" in content
    assert "Windows" in content or "macOS" in content
