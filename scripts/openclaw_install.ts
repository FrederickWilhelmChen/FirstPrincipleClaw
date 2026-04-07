#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "..");
const pluginSourceDir = path.join(repoRoot, "plugins", "firstclaw");
const bootstrapSourceFile = path.join(repoRoot, "openclaw", "bootstrap", "FIRSTCLAW_MEMORY.md");
const controlUiSourceDir = path.join(repoRoot, "openclaw", "control-ui");
const agentWorkspaceSourceDir = path.join(repoRoot, "openclaw", "agent-workspace");
const managedControlUiRelativeDir = "firstclaw/control-ui";
const managedAgentWorkspaceRelativeDir = "workspace-first-principle";
const agentId = "first-principle";

type Args = {
  openclawBin: string;
  stateDir?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    openclawBin: "openclaw",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--openclaw-bin") {
      args.openclawBin = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--state-dir") {
      args.stateDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}

function resolveStateDir(explicitValue?: string): string {
  if (explicitValue) {
    return path.resolve(explicitValue);
  }

  return path.resolve(os.homedir(), ".openclaw");
}

function toOpenClawPath(filepath: string): string {
  return path.resolve(filepath).replace(/\\/g, "/");
}

function runCommand(commandArgs: string[], dryRun = false, check = true): void {
  const printable = commandArgs.map((part) => JSON.stringify(part)).join(" ");
  console.log(`$ ${printable}`);
  if (dryRun) {
    return;
  }

  const command = process.platform === "win32"
    ? ["cmd", "/c", ...commandArgs]
    : commandArgs;

  const result = spawnSync(command[0], command.slice(1), {
    stdio: "inherit",
  });

  if (check && result.status !== 0) {
    throw new Error(`OpenClaw command failed with exit code ${result.status}: ${printable}`);
  }
}

function copyTree(src: string, dst: string, dryRun = false): void {
  console.log(`copy ${src} -> ${dst}`);
  if (dryRun) {
    return;
  }

  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
}

function copyFile(src: string, dst: string, dryRun = false): void {
  console.log(`copy ${src} -> ${dst}`);
  if (dryRun) {
    return;
  }

  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function ensureJsonSeed(filepath: string, dryRun = false): void {
  console.log(`seed ${filepath}`);
  if (dryRun) {
    return;
  }

  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, "{}\n", "utf8");
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const stateDir = resolveStateDir(args.stateDir);

  const pluginTargetDir = path.join(stateDir, "extensions", "firstclaw");
  const bootstrapTargetFile = path.join(stateDir, "firstclaw", "bootstrap", "FIRSTCLAW_MEMORY.md");
  const controlUiTargetDir = path.join(stateDir, managedControlUiRelativeDir);
  const guidanceJson = path.join(controlUiTargetDir, "assets", "current_guidance.json");
  const extraCss = path.join(controlUiTargetDir, "firstclaw-control-ui.css");
  const extraJs = path.join(controlUiTargetDir, "firstclaw-control-ui.js");
  const agentWorkspaceDir = path.join(stateDir, managedAgentWorkspaceRelativeDir);

  copyTree(pluginSourceDir, pluginTargetDir, args.dryRun);
  copyFile(bootstrapSourceFile, bootstrapTargetFile, args.dryRun);
  copyTree(controlUiSourceDir, controlUiTargetDir, args.dryRun);
  copyTree(agentWorkspaceSourceDir, agentWorkspaceDir, args.dryRun);
  ensureJsonSeed(guidanceJson, args.dryRun);

  runCommand([args.openclawBin, "config", "set", "plugins.entries.firstclaw.enabled", "true", "--strict-json"], args.dryRun);
  runCommand(
    [args.openclawBin, "config", "set", "plugins.entries.firstclaw.config.firstclaw.outputPath", toOpenClawPath(guidanceJson)],
    args.dryRun,
  );
  runCommand([args.openclawBin, "config", "set", "hooks.internal.entries.bootstrap-extra-files.enabled", "true", "--strict-json"], args.dryRun);
  runCommand(
    [args.openclawBin, "config", "set", "hooks.internal.entries.bootstrap-extra-files.paths[0]", toOpenClawPath(bootstrapTargetFile)],
    args.dryRun,
  );
  runCommand([args.openclawBin, "config", "set", "gateway.controlUi.extraCss", toOpenClawPath(extraCss)], args.dryRun);
  runCommand([args.openclawBin, "config", "set", "gateway.controlUi.extraJs", toOpenClawPath(extraJs)], args.dryRun);
  runCommand([args.openclawBin, "agents", "delete", agentId, "--force", "--json"], args.dryRun, false);
  runCommand(
    [args.openclawBin, "agents", "add", agentId, "--workspace", agentWorkspaceDir, "--non-interactive", "--json"],
    args.dryRun,
  );
  runCommand([args.openclawBin, "config", "set", "agents.list[1].default", "true", "--strict-json"], args.dryRun);

  console.log("");
  console.log("FirstClaw managed install prepared.");
  console.log(`State dir: ${stateDir}`);
  console.log(`Managed control-ui assets: ${controlUiTargetDir}`);
  console.log(`Managed guidance JSON: ${guidanceJson}`);
  console.log(`Managed agent workspace: ${agentWorkspaceDir}`);
}

main();
