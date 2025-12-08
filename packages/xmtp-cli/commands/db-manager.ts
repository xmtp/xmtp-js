import { spawn } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Argv } from "yargs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getBinaryPath(): string {
  const platform = process.platform;
  let binaryName: string;

  if (platform === "darwin") {
    binaryName = "db-manager-macos";
  } else if (platform === "linux") {
    binaryName = "db-manager-linux";
  } else {
    console.error(
      `[ERROR] Unsupported platform: ${platform}. db-manager only supports macOS and Linux.`,
    );
    process.exit(1);
  }

  // In development: commands/ -> ../db-manager/
  // In production: dist/commands/ -> ../db-manager/ (which is dist/db-manager/)
  const binaryPath = join(__dirname, "..", "db-manager", binaryName);

  if (existsSync(binaryPath)) {
    return binaryPath;
  }

  console.error(
    `[ERROR] db-manager binary not found: ${binaryName}\n` +
      `  Expected at: ${binaryPath}\n` +
      `  Current directory: ${__dirname}`,
  );
  process.exit(1);
}

export function registerDbManagerCommand(yargs: Argv) {
  return yargs.command(
    "db-manager",
    "Database management operations - bridges to db-manager binary",
    () => {
      // No options - just pass through all arguments
      return yargs.help(false).version(false);
    },
    () => {
      const binaryPath = getBinaryPath();

      // Ensure binary is executable
      try {
        chmodSync(binaryPath, 0o755);
      } catch (error) {
        console.error(
          `[ERROR] Failed to make binary executable: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }

      // Get all arguments from process.argv, skipping up to 'db-manager'
      const args = process.argv.slice(process.argv.indexOf("db-manager") + 1);

      // Spawn the binary with all arguments
      const child = spawn(binaryPath, args, {
        stdio: "inherit",
        shell: false,
      });

      child.on("error", (error) => {
        console.error(`[ERROR] Failed to execute db-manager: ${error.message}`);
        process.exit(1);
      });

      child.on("exit", (code) => {
        process.exit(code ?? 1);
      });
    },
  );
}
