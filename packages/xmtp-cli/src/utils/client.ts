import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Client, IdentifierKind, LogLevel } from "@xmtp/node-sdk";
import { hexToBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { XmtpConfig } from "./config.js";

const LOG_LEVELS = {
  off: LogLevel.Off,
  error: LogLevel.Error,
  warn: LogLevel.Warn,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
  trace: LogLevel.Trace,
} as const;

type LogLevelKey = keyof typeof LOG_LEVELS;

function isLogLevelKey(value: string): value is LogLevelKey {
  return value in LOG_LEVELS;
}

function parseLogLevel(value: string | undefined): LogLevel | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isLogLevelKey(value)) {
    const validLevels = Object.keys(LOG_LEVELS).join(", ");
    throw new Error(
      `Invalid log level: ${value}. Valid levels: ${validLevels}`,
    );
  }
  return LOG_LEVELS[value];
}

export function toHexBytes(hex: string): Uint8Array {
  const prefixedHex = hex.startsWith("0x") ? hex : `0x${hex}`;
  return hexToBytes(prefixedHex as `0x${string}`);
}

export async function createClient(config: XmtpConfig): Promise<Client> {
  if (!config.walletKey) {
    throw new Error(
      "Wallet key is required. Set XMTP_WALLET_KEY, use --wallet-key, or run 'init' to generate one.",
    );
  }

  if (!config.dbEncryptionKey) {
    throw new Error(
      "Database encryption key is required. Set XMTP_DB_ENCRYPTION_KEY, use --db-encryption-key, or run 'init' to generate one.",
    );
  }

  const account = privateKeyToAccount(config.walletKey as `0x${string}`);

  const signer = {
    type: "EOA" as const,
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({ message });
      return hexToBytes(signature);
    },
  };

  if (config.dbPath) {
    await mkdir(dirname(config.dbPath), { recursive: true });
  }

  const client = await Client.create(signer, {
    env: config.env,
    dbEncryptionKey: toHexBytes(config.dbEncryptionKey),
    dbPath: config.dbPath ?? undefined,
    gatewayHost: config.gatewayHost,
    loggingLevel: parseLogLevel(config.logLevel),
    structuredLogging: config.structuredLogging,
    disableDeviceSync: config.disableDeviceSync,
    appVersion: config.appVersion,
  });

  return client;
}

export function getAccountAddress(walletKey: string): string {
  const account = privateKeyToAccount(walletKey as `0x${string}`);
  return account.address;
}
