import {
  createClient as createWasmClient,
  DeviceSyncWorkerMode,
  generateInboxId,
  getInboxIdForIdentifier,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types/options";

export const createClient = async (
  identifier: Identifier,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const gatewayHost = options?.gatewayHost || undefined;
  const isSecure = host.startsWith("https");
  const inboxId =
    (await getInboxIdForIdentifier(host, gatewayHost, isSecure, identifier)) ||
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
    ? DeviceSyncWorkerMode.Disabled
    : DeviceSyncWorkerMode.Enabled;

  return createWasmClient(
    host,
    inboxId,
    identifier,
    dbPath,
    options?.dbEncryptionKey,
    historySyncUrl,
    deviceSyncWorkerMode,
    isLogging
      ? {
          structured: options.structuredLogging ?? false,
          performance: options.performanceLogging ?? false,
          level: options.loggingLevel,
        }
      : undefined,
    undefined, // allowOffline
    options?.appVersion,
    options?.gatewayHost,
    undefined, // nonce
    undefined, // authCallback
    undefined, // authHandle
    undefined, // clientMode
  );
};
