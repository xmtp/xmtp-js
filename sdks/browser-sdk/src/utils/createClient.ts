import {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForIdentifier,
  type Identifier,
  type LogOptions,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types/options";

export const createClient = async (
  identifier: Identifier,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const gatewayHost = options?.gatewayHost ?? null;
  const inboxId =
    (await getInboxIdForIdentifier(host, gatewayHost, identifier)) ||
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

  return createWasmClient(
    host,
    inboxId,
    identifier,
    dbPath,
    options?.dbEncryptionKey,
    historySyncUrl,
    deviceSyncWorkerMode,
    isLogging
      ? ({
          structuredLogging: options.structuredLogging ?? false,
          performanceLogging: options.performanceLogging ?? false,
          loggingLevel: options.loggingLevel,
        } as LogOptions)
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
