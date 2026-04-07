const { registerWriteGuidanceStateTool } = require("./src/write_guidance_state_tool.ts");

const plugin = {
  id: "firstclaw",
  name: "FirstClaw",
  description: "FirstClaw runtime contract plugin",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      firstclaw: {
        type: "object",
        additionalProperties: false,
        properties: {
          outputPath: { type: "string" },
          mirrorOutputPath: { type: "string" }
        }
      }
    }
  },
  register(api) {
    registerWriteGuidanceStateTool(api);
  }
};

module.exports = plugin;
module.exports.default = plugin;
