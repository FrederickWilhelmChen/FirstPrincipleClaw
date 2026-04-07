const test = require("node:test");
const assert = require("node:assert/strict");

const {
  shouldRenderPayload,
  createEmptyState,
  resolveStateUrl,
  summarizeGuidance,
  createRailMarkup,
  resolveThemeName,
} = require("../../openclaw/control-ui/firstclaw-control-ui");

test("empty payload does not overwrite an already rendered state", () => {
  const current = {
    true_intent: "Build an Excel tool that can handle large data sets",
    complexity_score: 78,
    task_type: "product",
    why_not_lower: "Needs batch processing and task coverage",
    why_not_higher: "No need for distributed compute yet",
    complexity_drivers: ["large row counts"],
    smallest_path: "Start with batch transforms and templated operations",
    hidden_assumptions: ["Users need any arbitrary task"],
    cut_these: ["multi-user collaboration"],
  };

  assert.equal(shouldRenderPayload(current, createEmptyState()), false);
});

test("first successful payload is renderable", () => {
  assert.equal(
    shouldRenderPayload(createEmptyState(), {
      true_intent: "Build an Excel automation tool",
      complexity_score: 62,
    }),
    true,
  );
});

test("state URL resolves relative to the injected script URL instead of the page URL", () => {
  assert.equal(
    resolveStateUrl("http://127.0.0.1:18789/__control_ui_extra__/extra.js"),
    "http://127.0.0.1:18789/__control_ui_extra__/assets/current_guidance.json",
  );
});

test("display summary keeps the rail compact and maps 10-point complexity to percentage score", () => {
  const summary = summarizeGuidance({
    complexity_score: 8,
    complexity_drivers: ["d1", "d2", "d3", "d4"],
    hidden_assumptions: ["a1", "a2", "a3", "a4"],
    cut_these: ["c1", "c2", "c3", "c4"],
    smallest_path: "ship the narrowest useful version",
  });

  assert.equal(summary.score, 80);
  assert.equal(summary.scorePercent, 80);
  assert.equal(summary.complexityLabel, "高");
  assert.deepEqual(summary.complexityDrivers, ["d1", "d2", "d3"]);
  assert.deepEqual(summary.hiddenAssumptions, ["a1", "a2", "a3"]);
  assert.deepEqual(summary.cutThese, ["c1", "c2", "c3"]);
  assert.deepEqual(summary.smallestPath, ["ship the narrowest useful version"]);
});

test("display summary preserves percentage scores that are already in 0-100 form", () => {
  const summary = summarizeGuidance({
    complexity_score: 78,
    complexity_drivers: [],
    hidden_assumptions: [],
    cut_these: [],
    smallest_path: "",
  });

  assert.equal(summary.score, 78);
  assert.equal(summary.scorePercent, 78);
  assert.equal(summary.complexityLabel, "高");
});

test("rail markup removes north star and hidden rationale sections", () => {
  const markup = createRailMarkup();

  assert.equal(markup.includes("North Star"), false);
  assert.equal(markup.includes("Why not lower"), false);
  assert.equal(markup.includes("Why not higher"), false);
  assert.equal(markup.includes("最小路径"), true);
  assert.equal(markup.includes("隐藏假设"), true);
  assert.equal(markup.includes("砍掉这些"), true);
});

test("theme resolution follows OpenClaw data-theme before system fallback", () => {
  assert.equal(resolveThemeName("dark", false), "dark");
  assert.equal(resolveThemeName("light", true), "light");
  assert.equal(resolveThemeName("system", true), "dark");
  assert.equal(resolveThemeName("", false), "light");
});
