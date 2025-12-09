import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { registerContentTypesCommand } from "./commands/content-types";
import { registerDebugCommand } from "./commands/debug";
import { registerGroupsCommand } from "./commands/groups";
import { registerKeysCommand } from "./commands/keys";
import { registerListCommand } from "./commands/list";
import { registerPermissionsCommand } from "./commands/permissions";
import { registerRevokeCommand } from "./commands/revoke";
import { registerSendCommand } from "./commands/send";

let envLoaded = false;

const argv = yargs(hideBin(process.argv))
  .scriptName("xmtp")
  .version("0.0.2")
  .middleware((argv: { _: (string | number)[]; [key: string]: unknown }) => {
    // Skip env loading for help/keys commands
    const command = argv._[0];
    if (command === "keys") {
      return;
    }

    if (envLoaded) {
      return;
    }

    const envPath = resolve(process.cwd(), ".env");
    if (!existsSync(envPath)) {
      console.error(
        [
          "[ERROR] .env file not found in current directory",
          `   Expected location: ${envPath}`,
          "",
          "   Please create a .env file with the following variables:",
          "   - XMTP_ENV (dev or production)",
          "   - XMTP_WALLET_KEY (your Ethereum wallet private key)",
          "   - XMTP_DB_ENCRYPTION_KEY (database encryption key)",
          "   - XMTP_DB_DIRECTORY (optional, database directory)",
        ].join("\n"),
      );
      process.exit(1);
    }

    try {
      loadEnvFile(envPath);
      envLoaded = true;
    } catch (error) {
      console.error(
        [
          "[ERROR] Failed to load .env file",
          `   ${error instanceof Error ? error.message : String(error)}`,
        ].join("\n"),
      );
      process.exit(1);
    }
  }, true);

registerGroupsCommand(argv);
registerSendCommand(argv);
registerDebugCommand(argv);
registerPermissionsCommand(argv);
registerListCommand(argv);
registerContentTypesCommand(argv);
registerKeysCommand(argv);
registerRevokeCommand(argv);

// Auto-exit after command completion
argv.fail((msg, err) => {
  if (err) {
    console.error(`[ERROR] ${err.message}`);
  } else if (msg) {
    console.error(`[ERROR] ${msg}`);
  }
  process.exit(1);
});

// Wrap parse to auto-exit on completion
const originalParse = argv.parse.bind(argv);
argv.parse = ((...args: Parameters<typeof originalParse>) => {
  try {
    const result = originalParse(...args);
    // If parse returns a promise (parseAsync), handle it
    if (result && typeof result.then === "function") {
      return result
        .then(() => {
          // Exit successfully if command completed without explicit exit
          setTimeout(() => {
            if (process.exitCode === undefined) {
              process.exit(0);
            }
          }, 0);
        })
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`[ERROR] ${errorMessage}`);
          process.exit(1);
        });
    }
    // For sync parse, schedule exit check
    setTimeout(() => {
      if (process.exitCode === undefined) {
        process.exit(0);
      }
    }, 0);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${errorMessage}`);
    process.exit(1);
    throw error;
  }
}) as typeof originalParse;

void argv.parse();
