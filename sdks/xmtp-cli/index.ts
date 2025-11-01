#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./utils/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
try {
  loadEnvFile(".env");
} catch {
  // Silently continue if .env file doesn't exist
}

// Get the CLI directory
const cliDir = __dirname;

// Helper to run tsx commands using the local tsx binary
async function runTsxCommand(
  scriptPath: string,
  args: string[] = [],
): Promise<number> {
  const fullPath = join(cliDir, scriptPath);
  const tsxPath = join(cliDir, "..", "..", "node_modules", ".bin", "tsx");
  return new Promise((resolve) => {
    const child = spawn(tsxPath, [fullPath, ...args], {
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

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  // Show help if no command provided
  if (!command || command === "--help" || command === "-h") {
    console.log(`
XMTP CLI - Manage XMTP protocol operations

Usage: xmtp <command> [options]

Commands:
  groups             Manage XMTP groups and DMs
  send               Send messages to conversations
  debug              Debug and information commands
  permissions        Manage group permissions
  list               List conversations and messages
  content            Content type operations

Options:
  --help, -h         Show this help message

Examples:
  xmtp groups --members 5 --name "My Group"     # Create a group
  xmtp send --target 0x123... --message "Hi!"     # Send a message
  xmtp debug info                                 # Get system information

For command-specific help:
  xmtp <command> --help
`);
    process.exit(0);
  }

  let exitCode = 0;

  switch (command) {
    case "groups":
      exitCode = await runTsxCommand("commands/groups.ts", commandArgs);
      break;

    case "send":
      exitCode = await runTsxCommand("commands/send.ts", commandArgs);
      break;

    case "debug":
      exitCode = await runTsxCommand("commands/debug.ts", commandArgs);
      break;

    case "permissions":
      exitCode = await runTsxCommand("commands/permissions.ts", commandArgs);
      break;

    case "list":
      exitCode = await runTsxCommand("commands/list.ts", commandArgs);
      break;

    case "content":
      exitCode = await runTsxCommand("commands/content-types.ts", commandArgs);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log(`Run 'xmtp --help' for usage information`);
      exitCode = 1;
      break;
  }

  process.exit(exitCode);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
