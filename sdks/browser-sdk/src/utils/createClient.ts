import init, {
  createClient as createWasmClient,
  generateInboxId,
  getInboxIdForAddress,
} from "@xmtp/wasm-bindings";
import { ApiUrls } from "@/constants";
import type { ClientOptions } from "@/types";

export const createClient = async (
  accountAddress: string,
  options?: Omit<ClientOptions, "codecs">,
) => {
  // initialize WASM module
  await init();

  const host = options?.apiUrl ?? ApiUrls[options?.env ?? "dev"];
  // TODO: add db path validation
  //       - must end with .db3
  //       - must not contain invalid characters
  //       - must not start with a dot
  const dbPath =
    options?.dbPath ?? `xmtp-${options?.env ?? "dev"}-${accountAddress}.db3`;

  const inboxId =
    (await getInboxIdForAddress(host, accountAddress)) ||
    generateInboxId(accountAddress);

  return createWasmClient(
    host,
    inboxId,
    accountAddress,
    dbPath,
    options?.encryptionKey,
  );
};
