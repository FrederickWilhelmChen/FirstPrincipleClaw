const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const baseDir = path.resolve(__dirname, "..", "..");

test("repo ships TypeScript OpenClaw install and uninstall scripts", () => {
  assert.equal(
    fs.existsSync(path.join(baseDir, "scripts", "openclaw_install.ts")),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(baseDir, "scripts", "openclaw_uninstall.ts")),
    true,
  );
});

test("package.json exposes node-based install entrypoints", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(baseDir, "package.json"), "utf8"),
  );

  assert.equal(typeof pkg.scripts["openclaw:install"], "string");
  assert.equal(typeof pkg.scripts["openclaw:uninstall"], "string");
  assert.equal(pkg.scripts["openclaw:install"].includes("openclaw_install.ts"), true);
  assert.equal(pkg.scripts["openclaw:uninstall"].includes("openclaw_uninstall.ts"), true);
});

test("TypeScript installer keeps the managed OpenClaw contract", () => {
  const installScript = fs.readFileSync(
    path.join(baseDir, "scripts", "openclaw_install.ts"),
    "utf8",
  );
  const uninstallScript = fs.readFileSync(
    path.join(baseDir, "scripts", "openclaw_uninstall.ts"),
    "utf8",
  );

  assert.equal(installScript.includes("firstclaw/control-ui"), true);
  assert.equal(installScript.includes("gateway.controlUi.extraCss"), true);
  assert.equal(installScript.includes("gateway.controlUi.extraJs"), true);
  assert.equal(installScript.includes("workspace-first-principle"), true);
  assert.equal(installScript.includes("first-principle"), true);
  assert.equal(uninstallScript.includes("gateway.controlUi.extraCss"), true);
  assert.equal(uninstallScript.includes("gateway.controlUi.extraJs"), true);
  assert.equal(uninstallScript.includes("workspace-first-principle"), true);
});

test("install.sh no longer requires python for the OpenClaw path", () => {
  const script = fs.readFileSync(path.join(baseDir, "install.sh"), "utf8");

  assert.equal(script.includes("python3"), false);
  assert.equal(script.includes("python "), false);
  assert.equal(script.toLowerCase().includes("node"), true);
});
