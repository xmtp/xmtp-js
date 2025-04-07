import {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForIdentifier,
  LogOptions,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";

export const createClient = async (
  identifier: Identifier,
  options?: Omit<ClientOptions, "codecs">,
) => {
  const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
  const inboxId =
    (await getInboxIdForIdentifier(host, identifier)) ||
    generateInboxId(identifier);
  const dbPath =
    options?.dbPath === undefined
      ? `xmtp-${options?.env || "dev"}-${inboxId}.db3`
      : options.dbPath;
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
    options?.dbEncryptionKey,
    historySyncUrl,
    isLogging
      ? new LogOptions(
          options.structuredLogging ?? false,
          options.performanceLogging ?? false,
          options.loggingLevel,
        )
      : undefined,
  );
};
