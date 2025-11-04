import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { Command } from "commander";
import { registerContentTypesCommand } from "./commands/content-types";
import { registerDebugCommand } from "./commands/debug";
import { registerGroupsCommand } from "./commands/groups";
import { registerListCommand } from "./commands/list";
import { registerPermissionsCommand } from "./commands/permissions";
import { registerSendCommand } from "./commands/send";

const program = new Command();

program.name("xmtp").description("XMTP CLI").version("0.0.2");

// Register all commands
registerGroupsCommand(program);
registerSendCommand(program);
registerDebugCommand(program);
registerPermissionsCommand(program);
registerListCommand(program);
registerContentTypesCommand(program);

// Parse arguments to check if it's just --version or --help
const args = process.argv.slice(2);
const isVersion = args.includes("--version") || args.includes("-V");
const isHelp =
  args.includes("--help") ||
  args.includes("-h") ||
  args.length === 0 ||
  args[0] === "help";

// Only require .env file for actual commands (not version/help)
if (!isVersion && !isHelp) {
  // Check for .env file in current working directory
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error("❌ Error: .env file not found in current directory");
    console.error(`   Expected location: ${envPath}`);
    console.error(
      "\n   Please create a .env file with the following variables:",
    );
    console.error("   - XMTP_ENV (dev or production)");
    console.error("   - XMTP_WALLET_KEY (your Ethereum wallet private key)");
    console.error("   - XMTP_DB_ENCRYPTION_KEY (database encryption key)");
    console.error("   - XMTP_DB_DIRECTORY (optional, database directory)");
    process.exit(1);
  }

  // Load environment variables from .env file
  try {
    loadEnvFile(envPath);
  } catch (error) {
    console.error("❌ Error: Failed to load .env file");
    console.error(
      `   ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

program.parse();
