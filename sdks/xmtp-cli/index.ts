#!/usr/bin/env node

import { Command } from "commander";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..", "..");

const program = new Command();

program
  .name("xmtp")
  .description("XMTP Copilot CLI - Manage XMTP protocol operations")
  .version("0.0.1");

// Helper to run tsx commands
function runTsxCommand(
  scriptPath: string,
  args: string[] = [],
): Promise<number> {
  const fullPath = join(rootDir, scriptPath);
  const tsxPath = join(rootDir, "node_modules", ".bin", "tsx");
  return new Promise((resolve) => {
    const child = spawn(tsxPath, [fullPath, ...args], {
      stdio: "inherit",
      shell: false,
      cwd: rootDir,
    });

    child.on("close", (code) => {
      resolve(code || 0);
    });

    child.on("error", (error) => {
      console.error(`Error: ${error.message}`);
      resolve(1);
    });
  });
}

// Simple commands that just run other scripts
program
  .command("ai")
  .description("Start Claude Code (AI coding assistant)")
  .action(async () => {
    console.log("🤖 Starting Claude Code...\n");
    const child = spawn("claude", [], { stdio: "inherit", shell: true });
    child.on("close", (code) => process.exit(code || 0));
  });

program
  .command("start")
  .description("Start XMTP and Slack channels (default)")
  .action(async () => {
    console.log("🚀 Starting XMTP Copilot channels...\n");
    const child = spawn("yarn", ["start"], { stdio: "inherit", shell: true });
    child.on("close", (code) => process.exit(code || 0));
  });

program
  .command("xmtp")
  .description("Start XMTP channel only")
  .action(async () => {
    console.log("🚀 Starting XMTP channel...\n");
    const child = spawn("yarn", ["dev:xmtp"], {
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => process.exit(code || 0));
  });

program
  .command("slack")
  .description("Start Slack channel only")
  .action(async () => {
    console.log("🚀 Starting Slack channel...\n");
    const child = spawn("yarn", ["dev:slack"], {
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => process.exit(code || 0));
  });

// Command files
program
  .command("groups")
  .description("Manage XMTP groups and DMs")
  .argument("[args...]", "Command arguments")
  .action(async (args) => {
    const exitCode = await runTsxCommand(
      "packages/cli/commands/groups.ts",
      args,
    );
    process.exit(exitCode);
  });

program
  .command("send")
  .description("Send messages to conversations")
  .argument("[args...]", "Command arguments")
  .action(async (args) => {
    const exitCode = await runTsxCommand("packages/cli/commands/send.ts", args);
    process.exit(exitCode);
  });

program
  .command("debug")
  .description("Debug and information commands")
  .argument("[args...]", "Command arguments")
  .action(async (args) => {
    const exitCode = await runTsxCommand(
      "packages/cli/commands/debug.ts",
      args,
    );
    process.exit(exitCode);
  });

program
  .command("permissions")
  .description("Manage group permissions")
  .argument("[args...]", "Command arguments")
  .action(async (args) => {
    const exitCode = await runTsxCommand(
      "packages/cli/commands/permissions.ts",
      args,
    );
    process.exit(exitCode);
  });

program
  .command("list")
  .description("List conversations and messages")
  .argument("[args...]", "Command arguments")
  .action(async (args) => {
    const exitCode = await runTsxCommand("packages/cli/commands/list.ts", args);
    process.exit(exitCode);
  });

program
  .command("content")
  .description("Content type operations")
  .argument("[args...]", "Command arguments")
  .action(async (args) => {
    const exitCode = await runTsxCommand(
      "packages/cli/commands/content-types.ts",
      args,
    );
    process.exit(exitCode);
  });

program.parse();
