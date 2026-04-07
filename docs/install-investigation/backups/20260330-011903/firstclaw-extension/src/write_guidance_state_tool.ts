const fs = require('node:fs');
const path = require('node:path');

function utcTimestamp() {
  return new Date().toISOString();
}

function writeJsonFile(filepath, payload) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
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
    timestamp: utcTimestamp(),
  };
}

function json(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    details: data,
  };
}

function resolveOutputPaths(api) {
  const cfg = api?.config?.firstclaw || {};
  const outputPath = cfg.outputPath
    ? path.resolve(String(cfg.outputPath))
    : path.resolve(__dirname, '..', '..', '..', 'data', 'current_guidance.json');
  const mirrorOutputPath = cfg.mirrorOutputPath
    ? path.resolve(String(cfg.mirrorOutputPath))
    : process.env.FIRSTCLAW_CONTROL_UI_DIR
      ? path.resolve(process.env.FIRSTCLAW_CONTROL_UI_DIR, 'assets', 'current_guidance.json')
      : '';

  return {
    outputPath,
    mirrorOutputPath,
  };
}

function registerWriteGuidanceStateTool(api) {
  const paths = resolveOutputPaths(api);

  api.registerTool(
    {
      name: 'write_guidance_state',
      label: 'Write Guidance State',
      description: 'Persist the current FirstClaw guidance state for the right rail and runtime contract.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        required: [
          'session_id',
          'turn_id',
          'task_type',
          'true_intent',
          'complexity_score',
          'complexity_drivers',
          'why_not_lower',
          'why_not_higher',
          'smallest_path',
        ],
        properties: {
          session_id: { type: 'string' },
          turn_id: { type: 'string' },
          task_type: { type: 'string' },
          true_intent: { type: 'string' },
          hidden_assumptions: { type: 'array', items: { type: 'string' } },
          complexity_score: { type: 'number' },
          complexity_drivers: { type: 'array', items: { type: 'string' } },
          why_not_lower: { type: 'string' },
          why_not_higher: { type: 'string' },
          smallest_path: { type: 'string' },
          cut_these: { type: 'array', items: { type: 'string' } },
        },
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
          mirror_output_path: paths.mirrorOutputPath || null,
        });
      },
    },
    { name: 'write_guidance_state' },
  );
}

module.exports = {
  registerWriteGuidanceStateTool,
};
