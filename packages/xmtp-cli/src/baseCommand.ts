import { env } from "node:process";
import { createInterface } from "node:readline";
import { Command, Errors, Flags } from "@oclif/core";
import type { Client } from "@xmtp/node-sdk";
import { createClient } from "./utils/client.js";
import {
  loadConfig,
  mergeConfig,
  VALID_ENVS,
  type XmtpConfig,
} from "./utils/config.js";
import { formatOutput, isTTY, jsonStringify } from "./utils/output.js";

export class BaseCommand extends Command {
  static baseFlags = {
    "env-file": Flags.string({
      description: "Path to .env file",
      helpValue: "<path>",
    }),
    env: Flags.option({
      options: [...VALID_ENVS],
      description: "XMTP environment",
    })(),
    "wallet-key": Flags.string({
      description: "Wallet private key (overrides env)",
      helpValue: "<key>",
    }),
    "db-encryption-key": Flags.string({
      description: "Database encryption key (overrides env)",
      helpValue: "<key>",
    }),
    "db-path": Flags.string({
      description: "Database directory path",
      helpValue: "<path>",
    }),
    "gateway-host": Flags.string({
      description: "Custom gateway URL",
      helpValue: "<url>",
    }),
    "log-level": Flags.option({
      options: ["off", "error", "warn", "info", "debug", "trace"] as const,
      description: "Logging level",
    })(),
    "structured-logging": Flags.boolean({
      description: "Enable structured JSON logging",
    }),
    "disable-device-sync": Flags.boolean({
      description: "Disable device sync",
    }),
    "app-version": Flags.string({
      description: "App version string",
      helpValue: "<version>",
    }),
    json: Flags.boolean({
      description: "Format output as JSON",
    }),
    verbose: Flags.boolean({
      description: "Show additional diagnostic information",
      default: false,
    }),
  };

  #config: XmtpConfig = {};
  jsonOutput = false;
  verbose = false;

  async init(): Promise<void> {
    await super.init();

    const { flags } = await this.parse(this.constructor as typeof BaseCommand);

    // Load config from .env file
    const fileConfig = loadConfig(flags["env-file"]);

    // Merge with CLI flags (CLI flags take precedence)
    this.#config = mergeConfig(fileConfig, {
      walletKey: flags["wallet-key"],
      dbEncryptionKey: flags["db-encryption-key"],
      dbPath: flags["db-path"],
      env: flags.env,
      gatewayHost: flags["gateway-host"],
      logLevel: flags["log-level"],
      structuredLogging: flags["structured-logging"],
      disableDeviceSync: flags["disable-device-sync"],
      appVersion: flags["app-version"],
    });

    this.jsonOutput = flags.json || env.XMTP_JSON_OUTPUT === "true";
    this.verbose = flags.verbose || env.XMTP_VERBOSE === "true";
  }

  output(data: unknown): void {
    this.log(formatOutput(data, this.jsonOutput));
  }

  /**
   * Output for streaming commands - uses compact JSONL format (one JSON object per line)
   * for easier parsing when multiple items are streamed.
   */
  streamOutput(data: unknown): void {
    if (this.jsonOutput) {
      // Use compact JSON for streaming (JSONL format)
      this.log(jsonStringify(data));
    } else {
      this.log(formatOutput(data, false));
    }
  }

  parseBigInt(value: string | undefined, flagName: string): bigint | undefined {
    if (value === undefined) {
      return undefined;
    }
    try {
      return BigInt(value);
    } catch {
      this.error(`Invalid value for --${flagName}: must be a numeric string`);
    }
  }

  async confirmAction(message: string, force: boolean): Promise<void> {
    if (force) {
      return;
    }

    if (!isTTY()) {
      this.error(
        "Cannot confirm in non-interactive terminal. Use --force to skip confirmation.",
      );
    }

    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(`WARNING: ${message}\nAre you sure? (y/N) `, resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== "y") {
      this.error("Operation cancelled");
    }
  }

  getConfig(): XmtpConfig {
    return this.#config;
  }

  async initClient(): Promise<Client> {
    const config = this.getConfig();
    const client = await createClient(config);

    if (this.verbose) {
      const lines: [string, string][] = [
        ["command", this.id ?? "unknown"],
        ["environment", config.env ?? "dev"],
        ["dbPath", config.dbPath ?? "in-memory"],
      ];

      if (client.accountIdentifier) {
        lines.push(["address", client.accountIdentifier.identifier]);
      }

      lines.push(
        ["inboxId", client.inboxId],
        ["installationId", client.installationId],
      );

      if (client.libxmtpVersion) {
        lines.push(["libxmtpVersion", client.libxmtpVersion]);
      }

      if (config.gatewayHost) {
        lines.push(["gatewayHost", config.gatewayHost]);
      }

      const maxKeyLen = Math.max(...lines.map(([k]) => k.length));
      const log = this.jsonOutput
        ? (msg: string) => {
            this.logToStderr(msg);
          }
        : (msg: string) => {
            this.log(msg);
          };
      for (const [key, value] of lines) {
        log(`${key.padEnd(maxKeyLen)}  ${value}`);
      }
    }

    return client;
  }

  async run(): Promise<void> {
    // Override in subclasses
  }

  catch(error: Error): never {
    if (error instanceof Errors.CLIError) {
      // Strip showHelp from CLI errors (parser/validation) to prevent
      // oclif's handle() from calling help.showHelp(process.argv) which
      // can cause cascading "Command not found" stack traces when
      // process.argv contains invalid arguments (e.g., after not-found
      // plugin redirect). These errors already say "See more help with --help".
      (error as Error & { showHelp?: boolean }).showHelp = false;
      throw error;
    }

    // Wrap non-CLI errors (e.g., SDK errors) with showHelp for
    // helpful command usage display alongside the error message
    const cliError = new Errors.CLIError(error.message);
    const errorWithHelp = cliError as Error & {
      showHelp?: boolean;
      parse?: { input: { argv: string[] } };
    };
    errorWithHelp.showHelp = true;
    errorWithHelp.parse = { input: { argv: this.argv } };
    throw errorWithHelp;
  }
}
