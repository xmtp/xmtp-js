#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// From dist/index.js: dist -> xmtp-cli -> sdks -> root
const rootDir = join(__dirname, "..", "..", "..");
// When linked, commands are in dist/commands relative to this file
const commandsDir = join(__dirname, "commands");

// Save raw argv before Commander parses it
const rawArgv = [...process.argv];

const program = new Command();

program.name("xmtp").description("XMTP CLI").version("0.0.1");

// Helper to run command - tries compiled version first, falls back to tsx in monorepo
async function runCommand(
  commandName: string,
  args: string[] = [],
): Promise<number> {
  // Try compiled command first (for linked/published packages)
  const compiledPath = join(commandsDir, `${commandName}.js`);
  if (existsSync(compiledPath)) {
    // Run the compiled command as a child process to avoid side effects
    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn("node", [compiledPath, ...args], {
        stdio: "inherit",
        shell: false,
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        resolve(code || 0);
      });

      child.on("error", () => {
        // If spawn fails, fall through to tsx
        resolve(-1);
      });
    });

    // If child process succeeded, return its exit code
    if (exitCode !== -1) {
      return exitCode;
    }
    // Otherwise, fall through to tsx fallback
  }

  // Fallback to tsx for monorepo development
  const scriptPath = `sdks/xmtp-cli/commands/${commandName}.ts`;
  const fullPath = join(rootDir, scriptPath);
  if (!existsSync(fullPath)) {
    console.error(`Error: Command ${commandName} not found`);
    return 1;
  }

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
    const commandIndex = rawArgv.findIndex((arg) => arg === "groups");
    const rawArgs = commandIndex >= 0 ? rawArgv.slice(commandIndex + 1) : args;
    const exitCode = await runCommand("groups", rawArgs);
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
    const commandIndex = rawArgv.findIndex((arg) => arg === "send");
    const rawArgs = commandIndex >= 0 ? rawArgv.slice(commandIndex + 1) : args;
    const exitCode = await runCommand("send", rawArgs);
    process.exit(exitCode);
  });

program
  .command("debug")
  .description("Debug and information commands")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex((arg) => arg === "debug");
    const rawArgs = commandIndex >= 0 ? rawArgv.slice(commandIndex + 1) : args;
    const exitCode = await runCommand("debug", rawArgs);
    process.exit(exitCode);
  });

program
  .command("permissions")
  .description("Manage group permissions")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex((arg) => arg === "permissions");
    const rawArgs = commandIndex >= 0 ? rawArgv.slice(commandIndex + 1) : args;
    const exitCode = await runCommand("permissions", rawArgs);
    process.exit(exitCode);
  });

program
  .command("list")
  .description("List conversations and messages")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex((arg) => arg === "list");
    const rawArgs = commandIndex >= 0 ? rawArgv.slice(commandIndex + 1) : args;
    const exitCode = await runCommand("list", rawArgs);
    process.exit(exitCode);
  });

program
  .command("content")
  .description("Content type operations")
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .argument("[args...]", "Command arguments")
  .action(async (args: string[]) => {
    const commandIndex = rawArgv.findIndex((arg) => arg === "content");
    const rawArgs = commandIndex >= 0 ? rawArgv.slice(commandIndex + 1) : args;
    const exitCode = await runCommand("content-types", rawArgs);
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
