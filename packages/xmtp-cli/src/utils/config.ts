import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { cwd, env, parseEnv as parseDotenv } from "node:process";
import type { XmtpEnv } from "@xmtp/node-sdk";

export const DEFAULT_HOME_DIR = join(homedir(), ".xmtp");
export const DEFAULT_ENV_PATH = join(DEFAULT_HOME_DIR, ".env");
export const DEFAULT_DB_PATH = join(DEFAULT_HOME_DIR, "xmtp-db");

export const VALID_ENVS = ["local", "dev", "production"] as const;
export const VALID_LOG_LEVELS = [
  "off",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
] as const;

export type XmtpConfig = {
  walletKey?: string;
  dbEncryptionKey?: string;
  dbPath?: string;
  env?: XmtpEnv;
  gatewayHost?: string;
  logLevel?: (typeof VALID_LOG_LEVELS)[number];
  structuredLogging?: boolean;
  disableDeviceSync?: boolean;
  appVersion?: string;
};

function parseEnv(value: string | undefined): XmtpConfig["env"] {
  return VALID_ENVS.includes(value as (typeof VALID_ENVS)[number])
    ? (value as XmtpConfig["env"])
    : undefined;
}

function parseLogLevel(value: string | undefined): XmtpConfig["logLevel"] {
  return VALID_LOG_LEVELS.includes(value as (typeof VALID_LOG_LEVELS)[number])
    ? (value as XmtpConfig["logLevel"])
    : undefined;
}

export async function loadConfig(envFile?: string): Promise<XmtpConfig> {
  // Parse the selected .env file without mutating process.env.
  // Priority: explicit --env-file > .env in cwd > ~/.xmtp/.env
  let fileValues: NodeJS.Dict<string> = {};
  if (envFile) {
    try {
      fileValues = parseDotenv(await readFile(resolve(envFile), "utf8"));
    } catch (error) {
      throw new Error(`Failed to load env file: ${envFile}`, { cause: error });
    }
  } else {
    try {
      fileValues = parseDotenv(await readFile(resolve(cwd(), ".env"), "utf8"));
    } catch {
      try {
        fileValues = parseDotenv(await readFile(DEFAULT_ENV_PATH, "utf8"));
      } catch {
        // Silently ignore if neither file exists
      }
    }
  }

  const values = { ...env, ...fileValues };

  return {
    walletKey: values.XMTP_WALLET_KEY,
    dbEncryptionKey: values.XMTP_DB_ENCRYPTION_KEY,
    dbPath: values.XMTP_DB_PATH,
    env: parseEnv(values.XMTP_ENV),
    gatewayHost: values.XMTP_GATEWAY_HOST,
    logLevel: parseLogLevel(values.XMTP_LOG_LEVEL),
    structuredLogging:
      values.XMTP_STRUCTURED_LOGGING === "true" ? true : undefined,
    disableDeviceSync:
      values.XMTP_DISABLE_DEVICE_SYNC === "true" ? true : undefined,
    appVersion: values.XMTP_APP_VERSION,
  };
}

export function mergeConfig(
  fileConfig: XmtpConfig,
  flags: Partial<XmtpConfig>,
  defaults?: Partial<XmtpConfig>,
): XmtpConfig {
  return {
    walletKey: flags.walletKey ?? fileConfig.walletKey,
    dbEncryptionKey: flags.dbEncryptionKey ?? fileConfig.dbEncryptionKey,
    dbPath: flags.dbPath ?? fileConfig.dbPath ?? DEFAULT_DB_PATH,
    env: flags.env ?? fileConfig.env ?? defaults?.env,
    gatewayHost: flags.gatewayHost ?? fileConfig.gatewayHost,
    logLevel: flags.logLevel ?? fileConfig.logLevel,
    structuredLogging: flags.structuredLogging ?? fileConfig.structuredLogging,
    disableDeviceSync: flags.disableDeviceSync ?? fileConfig.disableDeviceSync,
    appVersion:
      flags.appVersion ?? fileConfig.appVersion ?? defaults?.appVersion,
  };
}
