import {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForIdentifier,
  LogOptions,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types/options";
import { InvalidEncryptionKeyError } from "@/utils/errors";

export const createClient = async (
  identifier: Identifier,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const env = options?.env || "dev";
  const host = options?.apiUrl || ApiUrls[env];
  const inboxId =
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

  try {
    return createWasmClient(
      host,
      inboxId,
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
      undefined,
      options?.debugEventsEnabled,
      options?.appVersion,
    );
  } catch (error) {
    // Check if this is an encryption key error
    if (
      error instanceof Error &&
      error.message.includes("Failed to create reference from Buffer") &&
      "code" in error &&
      error.code === "InvalidArg"
    ) {
      throw new InvalidEncryptionKeyError();
    }
    // Re-throw other errors
    throw error;
  }
};
