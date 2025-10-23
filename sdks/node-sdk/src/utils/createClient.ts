import { join } from "node:path";
import process from "node:process";
import {
  createClient as createNodeClient,
  LogLevel,
  SyncWorkerMode,
  type Identifier,
  type LogOptions,
} from "@xmtp/node-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";
import { generateInboxId, getInboxIdForIdentifier } from "@/utils/inboxId";
import { isHexString } from "./validation";

export const createClient = async (
  identifier: Identifier,
  options?: ClientOptions,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const isSecure = host.startsWith("https");
  const inboxId =
    (await getInboxIdForIdentifier(identifier, env)) ||
    generateInboxId(identifier);
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
    level: options?.loggingLevel ?? LogLevel.off,
  };
  const historySyncUrl =
    options?.historySyncUrl === undefined
      ? HistorySyncUrls[env]
      : options.historySyncUrl;

  const deviceSyncWorkerMode = options?.disableDeviceSync
    ? SyncWorkerMode.disabled
    : SyncWorkerMode.enabled;

  const dbEncryptionKey = isHexString(options?.dbEncryptionKey)
    ? Buffer.from(options.dbEncryptionKey.replace(/^0x/, ""), "hex")
    : options?.dbEncryptionKey;

  return createNodeClient(
    host,
    isSecure,
    dbPath,
    inboxId,
    identifier,
    dbEncryptionKey,
    historySyncUrl,
    deviceSyncWorkerMode,
    logOptions,
    undefined,
    options?.debugEventsEnabled,
    options?.appVersion,
  );
};
