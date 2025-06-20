import {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForIdentifier,
  LogOptions,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types/options";

export const createClient = async (
  identifier: Identifier,
  inboxId?: string,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const finalInboxId =
    inboxId ||
    (await getInboxIdForIdentifier(host, identifier)) ||
    generateInboxId(identifier);
  const dbPath =
    options?.dbPath === undefined
      ? `xmtp-${env}-${inboxId}.db3`
      : options.dbPath;
  const isLogging =
    options &&
    (options.loggingLevel !== undefined ||
      options.structuredLogging ||
      options.performanceLogging);

  const historySyncUrl =
    options?.historySyncUrl === undefined
      ? HistorySyncUrls[env]
      : options.historySyncUrl;

  const deviceSyncWorkerMode = options?.disableDeviceSync
    ? "disabled"
    : "enabled";

  const allowOffline = !!inboxId;

  console.log("finalInboxId", finalInboxId);
  console.log("allowOffline", allowOffline);
  console.log("deviceSyncWorkerMode", deviceSyncWorkerMode);

  return createWasmClient(
    host,
    finalInboxId,
    identifier,
    dbPath,
    options?.dbEncryptionKey,
    historySyncUrl,
    deviceSyncWorkerMode,
    isLogging
      ? new LogOptions(
          options.structuredLogging ?? false,
          options.performanceLogging ?? false,
          options.loggingLevel,
        )
      : undefined,
    allowOffline,
  );
};
