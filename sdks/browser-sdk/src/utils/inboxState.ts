import init, {
  inboxStateFromInboxIds as wasmInboxStateFromInboxIds,
  type Backend,
} from "@xmtp/wasm-bindings";

/**
 * Gets the inbox state for the specified inbox IDs using a Backend
 *
 * @param backend - The Backend instance for API communication
 * @param inboxIds - The inbox IDs to get the state for
 * @returns The inbox state for the specified inbox IDs
 */
export const inboxStateFromInboxIds = async (
  backend: Backend,
  inboxIds: string[],
) => {
  await init();
  return wasmInboxStateFromInboxIds(backend, inboxIds);
};
