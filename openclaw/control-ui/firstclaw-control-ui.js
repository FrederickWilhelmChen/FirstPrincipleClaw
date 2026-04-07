const POLL_INTERVAL = 2500;
let lastRenderedState = null;
const MAX_VISIBLE_ITEMS = 3;
let themeObserver = null;

function resolveStateUrl(scriptUrl) {
  if (!scriptUrl) return "./assets/current_guidance.json";
  return new URL("./assets/current_guidance.json", scriptUrl).toString();
}

function detectScriptUrl() {
  if (typeof document === "undefined") return null;
  if (document.currentScript && document.currentScript.src) {
    return document.currentScript.src;
  }

  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const script = scripts.find((candidate) => (
    /firstclaw-control-ui\.js($|\?)/.test(candidate.src) ||
    /\/__control_ui_extra__\/extra\.js($|\?)/.test(candidate.src)
  ));
  return script ? script.src : null;
}

const FIRSTCLAW_STATE_URL = resolveStateUrl(detectScriptUrl());

function createEmptyState() {
  return {
    true_intent: "",
    complexity_score: 0,
    task_type: "",
    why_not_lower: "",
    why_not_higher: "",
    complexity_drivers: [],
    smallest_path: "",
    hidden_assumptions: [],
    cut_these: [],
  };
}

function clampList(items, limit = MAX_VISIBLE_ITEMS) {
  return Array.isArray(items) ? items.filter(Boolean).map(String).slice(0, limit) : [];
}

function normalizeScore(rawScore) {
  const score = Number(rawScore || 0);
  if (!Number.isFinite(score)) return 0;
  const normalized = score <= 10 ? score * 10 : score;
  return Math.max(0, Math.min(normalized, 100));
}

function scoreToPercent(score) {
  return Math.max(0, Math.min(score, 100));
}

function scoreToLabel(score) {
  if (score >= 70) return "高";
  if (score >= 40) return "中";
  if (score > 0) return "低";
  return "未评分";
}

function summarizeGuidance(payload) {
  const score = normalizeScore(payload.complexity_score);
  return {
    score,
    scorePercent: scoreToPercent(score),
    complexityLabel: scoreToLabel(score),
    complexityDrivers: clampList(payload.complexity_drivers),
    hiddenAssumptions: clampList(payload.hidden_assumptions),
    cutThese: clampList(payload.cut_these),
    smallestPath: payload.smallest_path ? [String(payload.smallest_path)] : [],
  };
}

function resolveThemeName(themeValue, prefersDark = false) {
  if (themeValue === "dark" || themeValue === "light") return themeValue;
  return prefersDark ? "dark" : "light";
}

function detectPreferredDark() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function syncRailTheme(rail) {
  if (typeof document === "undefined" || !rail) return;
  const themeValue = document.documentElement?.dataset?.theme || "";
  const theme = resolveThemeName(themeValue, detectPreferredDark());
  rail.dataset.theme = theme;
}

function watchTheme(rail) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined" || !rail) return;
  syncRailTheme(rail);
  themeObserver?.disconnect();
  themeObserver = new MutationObserver(() => {
    syncRailTheme(rail);
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

function createRailMarkup() {
  return `
    <button class="firstclaw-toggle-btn" aria-label="收起侧栏">&#x276E;</button>
    <div class="firstclaw-rail-header">
      <div class="firstclaw-rail-title">
        <strong>FirstClaw 侧栏</strong>
        <div class="firstclaw-rail-badge">只读</div>
      </div>
      <div class="firstclaw-rail-subtitle">在 OpenClaw 控制界面旁边持续提供紧凑的第一性原理提示。</div>
    </div>
    <div class="firstclaw-rail-body">
      <section class="firstclaw-card firstclaw-card-score">
        <div class="firstclaw-score-header">
          <span class="firstclaw-kicker">复杂度</span>
          <span class="firstclaw-score-pill" data-slot="complexity-label">未评分</span>
        </div>
        <div class="firstclaw-score-row">
          <div class="firstclaw-score" data-slot="complexity-score">0</div>
          <div class="firstclaw-score-caption">/100</div>
        </div>
        <div class="firstclaw-meter"><div class="firstclaw-meter-fill" data-slot="complexity-fill"></div></div>
      </section>
      <section class="firstclaw-card firstclaw-card-path">
        <span class="firstclaw-kicker">最小路径</span>
        <div class="firstclaw-list firstclaw-list-path" data-slot="smallest-path"></div>
      </section>
      <section class="firstclaw-card">
        <span class="firstclaw-kicker">复杂度驱动</span>
        <div class="firstclaw-list" data-slot="drivers"></div>
      </section>
      <section class="firstclaw-card">
        <span class="firstclaw-kicker">隐藏假设</span>
        <div class="firstclaw-list" data-slot="assumptions"></div>
      </section>
      <section class="firstclaw-card">
        <span class="firstclaw-kicker">砍掉这些</span>
        <div class="firstclaw-list" data-slot="cuts"></div>
      </section>
    </div>
  `;
}

function isMeaningfulPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  return Boolean(
    payload.true_intent ||
    payload.why_not_lower ||
    payload.why_not_higher ||
    payload.smallest_path ||
    (Array.isArray(payload.complexity_drivers) && payload.complexity_drivers.length) ||
    (Array.isArray(payload.hidden_assumptions) && payload.hidden_assumptions.length) ||
    (Array.isArray(payload.cut_these) && payload.cut_these.length) ||
    Number(payload.complexity_score || 0) > 0
  );
}

function shouldRenderPayload(currentState, nextPayload) {
  const nextIsMeaningful = isMeaningfulPayload(nextPayload);
  if (!nextIsMeaningful) return false;
  return JSON.stringify(currentState || createEmptyState()) !== JSON.stringify(nextPayload);
}

function ensureRail() {
  let rail = document.getElementById("firstclaw-control-ui-rail");
  if (rail) return rail;

  rail = document.createElement("aside");
  rail.id = "firstclaw-control-ui-rail";
  rail.classList.add("firstclaw-rail-empty");
  rail.innerHTML = createRailMarkup();

  document.body.appendChild(rail);
  document.body.classList.add("firstclaw-control-ui-enabled");
  watchTheme(rail);

  const btn = rail.querySelector(".firstclaw-toggle-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      const collapsed = rail.classList.toggle("firstclaw-rail-collapsed");
      document.body.classList.toggle("firstclaw-rail-collapsed", collapsed);
      btn.innerHTML = collapsed ? "&#x276F;" : "&#x276E;";
      btn.setAttribute("aria-label", collapsed ? "展开侧栏" : "收起侧栏");
    });
  }

  return rail;
}

function setText(root, slot, value, fallback = "") {
  const node = root.querySelector(`[data-slot="${slot}"]`);
  if (node) node.textContent = value || fallback;
}

function setList(root, slot, items, marker) {
  const node = root.querySelector(`[data-slot="${slot}"]`);
  if (!node) return;
  node.innerHTML = "";

  const cleaned = Array.isArray(items) ? items.filter(Boolean).map(String) : [];
  if (!cleaned.length) {
    const empty = document.createElement("div");
    empty.className = "firstclaw-empty";
    empty.textContent = "暂无内容";
    node.appendChild(empty);
    return;
  }

  cleaned.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "firstclaw-list-item";
    row.innerHTML = `<strong>${typeof marker === "function" ? marker(index) : marker}</strong>${item}`;
    node.appendChild(row);
  });
}

function renderState(root, payload) {
  const summary = summarizeGuidance(payload);
  const rail = root.closest("#firstclaw-control-ui-rail");
  setText(root, "complexity-score", String(summary.score));
  setText(root, "complexity-label", summary.complexityLabel);

  const fill = root.querySelector('[data-slot="complexity-fill"]');
  if (fill) fill.style.width = `${summary.scorePercent}%`;

  setList(root, "smallest-path", summary.smallestPath, "PATH");
  setList(root, "drivers", summary.complexityDrivers, (index) => `D${index + 1}`);
  setList(root, "assumptions", summary.hiddenAssumptions, (index) => `A${index + 1}`);
  setList(root, "cuts", summary.cutThese, (index) => `C${index + 1}`);
  if (rail) rail.classList.remove("firstclaw-rail-empty");
}

async function fetchState() {
  const response = await fetch(FIRSTCLAW_STATE_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load state: ${response.status}`);
  return await response.json();
}

async function tick(root) {
  try {
    const payload = await fetchState();
    if (shouldRenderPayload(lastRenderedState, payload)) {
      renderState(root, payload);
      lastRenderedState = payload;
    }
  } catch (_error) {
    // Keep the current UI stable when the polling request fails or returns no data.
  }
}

function start() {
  if (!document.body || document.getElementById("firstclaw-control-ui-rail")) return;
  const root = ensureRail();
  void tick(root);
  window.setInterval(() => {
    void tick(root);
  }, POLL_INTERVAL);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createEmptyState,
    isMeaningfulPayload,
    shouldRenderPayload,
    resolveStateUrl,
    summarizeGuidance,
    createRailMarkup,
    resolveThemeName,
  };
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
