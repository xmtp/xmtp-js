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
let envLoaded = false;

program.name("xmtp").description("XMTP CLI").version("0.0.2");

// Register all commands
registerGroupsCommand(program);
registerSendCommand(program);
registerDebugCommand(program);
registerPermissionsCommand(program);
registerListCommand(program);
registerContentTypesCommand(program);

program.hook("preAction", (thisCommand, actionCommand) => {
  if (envLoaded) {
    return;
  }

  if (actionCommand.name() === "help") {
    return;
  }

  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    thisCommand.error(
      [
        "❌ Error: .env file not found in current directory",
        `   Expected location: ${envPath}`,
        "",
        "   Please create a .env file with the following variables:",
        "   - XMTP_ENV (dev or production)",
        "   - XMTP_WALLET_KEY (your Ethereum wallet private key)",
        "   - XMTP_DB_ENCRYPTION_KEY (database encryption key)",
        "   - XMTP_DB_DIRECTORY (optional, database directory)",
      ].join("\n"),
    );
  }

  try {
    loadEnvFile(envPath);
    envLoaded = true;
  } catch (error) {
    thisCommand.error(
      [
        "❌ Error: Failed to load .env file",
        `   ${error instanceof Error ? error.message : String(error)}`,
      ].join("\n"),
    );
  }
});

program.parse();
