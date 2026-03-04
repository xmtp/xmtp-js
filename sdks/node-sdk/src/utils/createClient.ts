import { join } from "node:path";
import process from "node:process";
import {
  createClientWithBackend,
  LogLevel,
  SyncWorkerMode,
  type Backend,
  type Identifier,
  type LogOptions,
} from "@xmtp/node-bindings";
import type { ClientOptions } from "@/types";
import { createBackend, envToString } from "@/utils/createBackend";
import { generateInboxId, getInboxIdForIdentifier } from "@/utils/inboxId";
import { isHexString } from "./validation";

const networkOptionKeys = [
  "env",
  "apiUrl",
  "gatewayHost",
  "appVersion",
] as const;

const hasBackend = (
  options: ClientOptions,
): options is { backend: Backend } & ClientOptions => {
  return "backend" in options;
};

const resolveBackend = async (options?: ClientOptions): Promise<Backend> => {
  if (!options) {
    return createBackend();
  }

  if (hasBackend(options)) {
    // Validate that no NetworkOptions fields are also set
    const conflicting = networkOptionKeys.filter(
      (key) =>
        key in options && (options as Record<string, unknown>)[key] != null,
    );
    if (conflicting.length > 0) {
      throw new Error(
        `Cannot specify both 'backend' and network options (${conflicting.join(", ")}). ` +
          `Use either a pre-built Backend or network options, not both.`,
      );
    }
    return options.backend;
  }

  // No backend provided — build one from NetworkOptions
  return createBackend(options);
};

export const createClient = async (
  identifier: Identifier,
  options?: ClientOptions,
) => {
  const backend = await resolveBackend(options);

  const inboxId =
    (await getInboxIdForIdentifier(backend, identifier)) ||
    generateInboxId(identifier, options?.nonce);

  const env = envToString(backend.env);

  let dbPath: string | null;
  if (options?.dbPath === undefined) {
    // Default: auto-generated path
    dbPath = join(process.cwd(), `xmtp-${env}-${inboxId}.db3`);
  } else if (typeof options.dbPath === "function") {
    // Callback function: call with inbox ID
    dbPath = options.dbPath(inboxId);
  } else {
    // String or null: use as-is
    dbPath = options.dbPath;
  }

  const logOptions: LogOptions = {
    structured: options?.structuredLogging ?? false,
    level: options?.loggingLevel ?? LogLevel.Off,
  };
  const deviceSyncWorkerMode = options?.disableDeviceSync
    ? SyncWorkerMode.Disabled
    : SyncWorkerMode.Enabled;

  const dbEncryptionKey = isHexString(options?.dbEncryptionKey)
    ? Buffer.from(options.dbEncryptionKey.replace(/^0x/, ""), "hex")
    : options?.dbEncryptionKey;

  const client = await createClientWithBackend(
    backend,
    {
      dbPath: dbPath ?? undefined,
      encryptionKey: dbEncryptionKey,
    },
    inboxId,
    identifier,
    deviceSyncWorkerMode,
    logOptions,
    undefined, // allowOffline
    options?.nonce,
  );

  return { client, env };
};
