import init, {
  generateInboxId as wasmGenerateInboxId,
  getInboxIdForIdentifier as wasmGetInboxIdForIdentifier,
  type Backend,
  type Identifier,
} from "@xmtp/wasm-bindings";

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
  await init();
  return wasmGenerateInboxId(identifier, nonce);
};

/**
 * Gets the inbox ID for a specific identifier using a Backend
 *
 * @param backend - The Backend instance for API communication
 * @param identifier - The identifier to get the inbox ID for
 * @returns Promise that resolves with the inbox ID for the identifier
 */
export const getInboxIdForIdentifier = async (
  backend: Backend,
  identifier: Identifier,
): Promise<string | undefined> => {
  await init();
  return wasmGetInboxIdForIdentifier(backend, identifier);
};
