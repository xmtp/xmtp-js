#!/usr/bin/env node
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// From dist/index.js: dist -> xmtp-cli -> sdks -> root
const rootDir = join(__dirname, "..", "..", "..");

// Save raw argv before Commander parses it
const rawArgv = [...process.argv];

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
  // Try to find tsx in node_modules - check root first, then fallback to local
  // If not found at root, try using which/tsx from PATH or yarn/npx
  return new Promise((resolve) => {
    const child = spawn("tsx", [fullPath, ...args], {
      stdio: "inherit",
      shell: true,
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
  .action(() => {
    console.log("🤖 Starting Claude Code...\n");
    const child = spawn("claude", [], { stdio: "inherit", shell: true });
    child.on("close", (code) => process.exit(code || 0));
  });

program
  .command("start")
  .description("Start XMTP and Slack channels (default)")
  .action(() => {
    console.log("🚀 Starting XMTP Copilot channels...\n");
    const child = spawn("yarn", ["start"], { stdio: "inherit", shell: true });
    child.on("close", (code) => process.exit(code || 0));
  });

program
  .command("xmtp")
  .description("Start XMTP channel only")
  .action(() => {
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
  .action(() => {
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
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex(arg => arg === "groups");
    const rawArgs = commandIndex >= 0 
      ? rawArgv.slice(commandIndex + 1)
      : args;
    const exitCode = await runTsxCommand(
      "sdks/xmtp-cli/commands/groups.ts",
      rawArgs,
    );
    process.exit(exitCode);
  });

program
  .command("send")
  .description("Send messages to conversations")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    // Get raw args from saved argv before Commander parsed them
    const commandIndex = rawArgv.findIndex(arg => arg === "send");
    const rawArgs = commandIndex >= 0 
      ? rawArgv.slice(commandIndex + 1)
      : args;
    const exitCode = await runTsxCommand(
      "sdks/xmtp-cli/commands/send.ts",
      rawArgs,
    );
    process.exit(exitCode);
  });

program
  .command("debug")
  .description("Debug and information commands")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex(arg => arg === "debug");
    const rawArgs = commandIndex >= 0 
      ? rawArgv.slice(commandIndex + 1)
      : args;
    const exitCode = await runTsxCommand(
      "sdks/xmtp-cli/commands/debug.ts",
      rawArgs,
    );
    process.exit(exitCode);
  });

program
  .command("permissions")
  .description("Manage group permissions")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex(arg => arg === "permissions");
    const rawArgs = commandIndex >= 0 
      ? rawArgv.slice(commandIndex + 1)
      : args;
    const exitCode = await runTsxCommand(
      "sdks/xmtp-cli/commands/permissions.ts",
      rawArgs,
    );
    process.exit(exitCode);
  });

program
  .command("list")
  .description("List conversations and messages")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex(arg => arg === "list");
    const rawArgs = commandIndex >= 0 
      ? rawArgv.slice(commandIndex + 1)
      : args;
    const exitCode = await runTsxCommand(
      "sdks/xmtp-cli/commands/list.ts",
      rawArgs,
    );
    process.exit(exitCode);
  });

program
  .command("content")
  .description("Content type operations")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex(arg => arg === "content");
    const rawArgs = commandIndex >= 0 
      ? rawArgv.slice(commandIndex + 1)
      : args;
    const exitCode = await runTsxCommand(
      "sdks/xmtp-cli/commands/content-types.ts",
      rawArgs,
    );
    process.exit(exitCode);
  });

program
  .command("lint")
  .description("Run linter (yarn lint from root)")
  .action(() => {
    console.log("🔍 Running linter from root...\n");
    const child = spawn("yarn", ["lint"], {
      stdio: "inherit",
      shell: true,
      cwd: rootDir,
    });
    child.on("close", (code) => process.exit(code || 0));
  });

program.parse();
