import init, {
  inboxStateFromInboxIds as wasmInboxStateFromInboxIds,
} from "@xmtp/wasm-bindings";
import { ApiUrls } from "@/constants";
import type { XmtpEnv } from "@/types/options";

const initPromise = init();

/**
 * Gets the inbox state for the specified inbox IDs without a client
 *
 * @param inboxIds - The inbox IDs to get the state for
 * @param env - Optional XMTP environment configuration (default: "dev")
 * @param gatewayHost - Optional gateway host override
 * @returns The inbox state for the specified inbox IDs
 */
export const inboxStateFromInboxIds = async (
  inboxIds: string[],
  env?: XmtpEnv,
  gatewayHost?: string,
) => {
  await initPromise;
  const host = ApiUrls[env ?? "dev"];
  return wasmInboxStateFromInboxIds(host, gatewayHost ?? null, inboxIds);
};
