#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

function removePath(targetPath: string, dryRun = false): void {
  console.log(`remove ${targetPath}`);
  if (dryRun || !fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const stateDir = resolveStateDir(args.stateDir);

  const controlUiDir = path.join(stateDir, "firstclaw");
  const pluginDir = path.join(stateDir, "extensions", "firstclaw");
  const agentWorkspaceDir = path.join(stateDir, "workspace-first-principle");
  const agentStateDir = path.join(stateDir, "agents", "first-principle");

  runCommand([args.openclawBin, "config", "unset", "gateway.controlUi.extraCss"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "unset", "gateway.controlUi.extraJs"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "unset", "plugins.entries.firstclaw.config.firstclaw.outputPath"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "unset", "plugins.entries.firstclaw.config.firstclaw.mirrorOutputPath"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "unset", "plugins.entries.firstclaw"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "unset", "plugins.installs.firstclaw"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "unset", "hooks.internal.entries.bootstrap-extra-files.paths[0]"], args.dryRun, false);
  runCommand([args.openclawBin, "config", "set", "hooks.internal.entries.bootstrap-extra-files.enabled", "false", "--strict-json"], args.dryRun, false);
  runCommand([args.openclawBin, "agents", "delete", "first-principle", "--force", "--json"], args.dryRun, false);

  removePath(controlUiDir, args.dryRun);
  removePath(pluginDir, args.dryRun);
  removePath(agentWorkspaceDir, args.dryRun);
  removePath(agentStateDir, args.dryRun);

  console.log("");
  console.log("FirstClaw managed uninstall prepared.");
  console.log(`State dir: ${stateDir}`);
}

main();
