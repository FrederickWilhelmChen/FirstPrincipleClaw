const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { createToolFactoryHarness } = require("./tool-factory-test-harness");
const plugin = require("../index.ts");

test("firstclaw plugin registers write_guidance_state tool", () => {
  const harness = createToolFactoryHarness({});

  plugin.register(harness.api);

  const tool = harness.resolveTool("write_guidance_state");
  assert.equal(tool.name, "write_guidance_state");
  assert.equal(tool.description.includes("中文"), true);
  assert.equal(tool.description.includes("同一 session"), true);
  assert.equal(tool.description.includes("补充"), true);
});

test("write_guidance_state tool writes structured guidance state and mirror snapshot", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "firstclaw-plugin-"));
  const outputPath = path.join(tempDir, "firstclaw", "control-ui", "assets", "current_guidance.json");
  const mirrorPath = path.join(tempDir, "mirror", "current_guidance.json");
  const harness = createToolFactoryHarness({
    firstclaw: {
      outputPath,
      mirrorOutputPath: mirrorPath
    }
  });

  plugin.register(harness.api);
  const tool = harness.resolveTool("write_guidance_state");

  const result = await tool.execute("tool_call_001", {
    session_id: "oc_session_123",
    turn_id: "turn_001",
    task_type: "product",
    true_intent: "Compress login into the smallest secure loop",
    hidden_assumptions: ["Default to OAuth"],
    complexity_score: 62,
    complexity_drivers: ["cross-module coupling"],
    why_not_lower: "Authentication boundaries still matter.",
    why_not_higher: "Not yet a platform-level identity system.",
    smallest_path: "Start with username/password and single-session JWT.",
    cut_these: ["OAuth"]
  });

  assert.equal(fs.existsSync(outputPath), true);
  assert.equal(fs.existsSync(mirrorPath), true);

  const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(payload.session_id, "oc_session_123");
  assert.equal(payload.turn_id, "turn_001");
  assert.equal(payload.complexity_score, 62);
  assert.deepEqual(payload.cut_these, ["OAuth"]);

  assert.equal(Array.isArray(result.content), true);
  assert.equal(JSON.stringify(result.details).includes("oc_session_123"), true);
});
