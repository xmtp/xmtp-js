import {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForIdentifier,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";

export const createClient = async (
  identifier: Identifier,
  encryptionKey: Uint8Array,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
  const inboxId =
    (await getInboxIdForIdentifier(host, identifier)) ||
    generateInboxId(identifier);
  const dbPath =
    options?.dbPath || `xmtp-${options?.env || "dev"}-${inboxId}.db3`;
  const isLogging =
    options &&
    (options.loggingLevel !== undefined ||
      options.structuredLogging ||
      options.performanceLogging);

  const historySyncUrl =
    options?.historySyncUrl || HistorySyncUrls[options?.env || "dev"];

  return createWasmClient(
    host,
    inboxId,
    identifier,
    dbPath,
    encryptionKey,
    historySyncUrl,
    isLogging
      ? {
          structured: options.structuredLogging ?? false,
          performance: options.performanceLogging ?? false,
          level: options.loggingLevel,
        }
      : undefined,
  );
};
