#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// When published, commands are in dist/commands relative to this file
const commandsDir = join(__dirname, "commands");

// Save raw argv before Commander parses it
const rawArgv = [...process.argv];

const program = new Command();

program.name("xmtp").description("XMTP CLI").version("0.0.1");

// Helper to run command - only uses compiled version for NPM package
async function runCommand(
  commandName: string,
  args: string[] = [],
): Promise<number> {
  const compiledPath = join(commandsDir, `${commandName}.js`);
  if (!existsSync(compiledPath)) {
    console.error(`Error: Command ${commandName} not found`);
    return 1;
  }

  // Run the compiled command as a child process to avoid side effects
  return new Promise<number>((resolve) => {
    const child = spawn("node", [compiledPath, ...args], {
      stdio: "inherit",
      shell: false,
      cwd: process.cwd(),
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

program.parse();
