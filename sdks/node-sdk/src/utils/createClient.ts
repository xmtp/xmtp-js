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

export const createClient = async (
  identifier: Identifier,
  inboxId?: string,
  options?: ClientOptions,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const isSecure = host.startsWith("https");

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

  const allowOffline = !!inboxId;

  const finalInboxId =
    inboxId ||
    (await getInboxIdForIdentifier(identifier, env)) ||
    generateInboxId(identifier);

  const dbPath =
    options?.dbPath === undefined
      ? join(process.cwd(), `xmtp-${env}-${inboxId}.db3`)
      : options.dbPath;

  console.log("dbPath", dbPath);
  console.log("finalInboxId", finalInboxId);
  console.log("allowOffline", allowOffline);
  console.log("deviceSyncWorkerMode", deviceSyncWorkerMode);

  return createNodeClient(
    host,
    isSecure,
    dbPath,
    finalInboxId,
    identifier,
    options?.dbEncryptionKey,
    historySyncUrl,
    deviceSyncWorkerMode,
    logOptions,
    allowOffline,
  );
};
