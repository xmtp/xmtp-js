import init, {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForAddress,
  LogOptions,
} from "@xmtp/wasm-bindings";
import { ApiUrls, HistorySyncUrls } from "@/constants";
import type { ClientOptions } from "@/types";

export const createClient = async (
  accountAddress: string,
  encryptionKey: Uint8Array,
  options?: Omit<ClientOptions, "codecs">,
) => {
  // initialize WASM module
  await init();

  const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
  const dbPath =
    options?.dbPath || `xmtp-${options?.env || "dev"}-${accountAddress}.db3`;

  const inboxId =
    (await getInboxIdForAddress(host, accountAddress)) ||
    generateInboxId(accountAddress);

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
    accountAddress,
    dbPath,
    encryptionKey,
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
