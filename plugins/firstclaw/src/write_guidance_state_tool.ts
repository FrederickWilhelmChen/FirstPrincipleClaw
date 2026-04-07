const fs = require("node:fs");
const path = require("node:path");

function utcTimestamp() {
  return new Date().toISOString();
}

function writeJsonFile(filepath, payload) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), "utf8");
}

function buildPayload(params) {
  return {
    session_id: String(params.session_id),
    turn_id: String(params.turn_id),
    task_type: String(params.task_type),
    true_intent: String(params.true_intent),
    hidden_assumptions: Array.isArray(params.hidden_assumptions) ? params.hidden_assumptions.filter(Boolean).map(String) : [],
    complexity_score: Number(params.complexity_score || 0),
    complexity_drivers: Array.isArray(params.complexity_drivers) ? params.complexity_drivers.filter(Boolean).map(String) : [],
    why_not_lower: String(params.why_not_lower),
    why_not_higher: String(params.why_not_higher),
    smallest_path: String(params.smallest_path),
    cut_these: Array.isArray(params.cut_these) ? params.cut_these.filter(Boolean).map(String) : [],
    timestamp: utcTimestamp()
  };
}

function json(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    details: data
  };
}

function resolveDefaultManagedOutputPath() {
  return path.resolve(__dirname, "..", "..", "..", "firstclaw", "control-ui", "assets", "current_guidance.json");
}

function resolveOutputPaths(api) {
  const cfg = api?.config?.firstclaw || {};
  const outputPath = cfg.outputPath ? path.resolve(String(cfg.outputPath)) : resolveDefaultManagedOutputPath();
  const mirrorOutputPath = cfg.mirrorOutputPath ? path.resolve(String(cfg.mirrorOutputPath)) : "";

  return {
    outputPath,
    mirrorOutputPath
  };
}

function registerWriteGuidanceStateTool(api) {
  const paths = resolveOutputPaths(api);

  api.registerTool(
    {
      name: "write_guidance_state",
      label: "写入 FirstClaw 指导状态",
      description: "把当前 FirstClaw 结构化指导写入右侧栏运行时文件。所有面向展示的自然语言字段必须使用简体中文填写。同一 session 中，后续用户输入默认是在原任务上补充约束或澄清范围，除非用户明确改题，否则不要只围绕最后一句话重写整个任务。",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: [
          "session_id",
          "turn_id",
          "task_type",
          "true_intent",
          "complexity_score",
          "complexity_drivers",
          "why_not_lower",
          "why_not_higher",
          "smallest_path"
        ],
        properties: {
          session_id: { type: "string", description: "当前会话 ID。" },
          turn_id: { type: "string", description: "当前轮次 ID。" },
          task_type: { type: "string", description: "任务类型，使用简短中文。" },
          true_intent: { type: "string", description: "用户真实意图，使用简体中文。" },
          hidden_assumptions: {
            type: "array",
            description: "隐藏假设列表，最多 3 条，使用简体中文短句。",
            items: { type: "string" }
          },
          complexity_score: { type: "number", description: "复杂度分数，推荐直接填写 0-100 百分制。" },
          complexity_drivers: {
            type: "array",
            description: "复杂度驱动因素，最多 3 条，使用简体中文短句。",
            items: { type: "string" }
          },
          why_not_lower: { type: "string", description: "给模型内部参考的补充理由，使用简体中文。" },
          why_not_higher: { type: "string", description: "给模型内部参考的补充理由，使用简体中文。" },
          smallest_path: { type: "string", description: "最小可行路径，使用简体中文，一句话说清。" },
          cut_these: {
            type: "array",
            description: "建议砍掉的内容，最多 3 条，使用简体中文短句。",
            items: { type: "string" }
          }
        }
      },
      async execute(_toolCallId, params) {
        const payload = buildPayload(params);

        writeJsonFile(paths.outputPath, payload);
        if (paths.mirrorOutputPath) {
          writeJsonFile(paths.mirrorOutputPath, payload);
        }

        return json({
          ok: true,
          session_id: payload.session_id,
          turn_id: payload.turn_id,
          output_path: paths.outputPath,
          mirror_output_path: paths.mirrorOutputPath || null
        });
      }
    },
    { name: "write_guidance_state" }
  );
}

module.exports = {
  registerWriteGuidanceStateTool
};
