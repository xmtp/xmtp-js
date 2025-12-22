import init, {
  generateInboxId as wasmGenerateInboxId,
  getInboxIdForIdentifier as wasmGetInboxIdForIdentifier,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls } from "@/constants";
import type { XmtpEnv } from "@/types/options";

const initPromise = init();

/**
 * Generates an inbox ID for a given identifier
 *
 * @param identifier - The identifier to generate an inbox ID for
 * @param nonce - Optional nonce to use for generating the inbox ID
 * @returns Promise that resolves with the generated inbox ID
 */
export const generateInboxId = async (
  identifier: Identifier,
  nonce?: bigint,
): Promise<string> => {
  await initPromise;
  return wasmGenerateInboxId(identifier, nonce);
};

/**
 * Gets the inbox ID for a specific identifier and optional environment
 *
 * @param identifier - The identifier to get the inbox ID for
 * @param env - Optional XMTP environment configuration (default: "dev")
 * @param gatewayHost - Optional gateway host override
 * @returns Promise that resolves with the inbox ID for the identifier
 */
export const getInboxIdForIdentifier = async (
  identifier: Identifier,
  env?: XmtpEnv,
  gatewayHost?: string,
): Promise<string | undefined> => {
  await initPromise;
  const host = env ? ApiUrls[env] : ApiUrls.dev;
  return wasmGetInboxIdForIdentifier(host, gatewayHost ?? null, identifier);
};
