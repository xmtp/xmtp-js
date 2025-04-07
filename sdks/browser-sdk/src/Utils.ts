import type { Identifier } from "@xmtp/wasm-bindings";
import type { XmtpEnv } from "@/types/options";
import { UtilsWorkerClass } from "@/UtilsWorkerClass";

/**
 * Utility class that provides helper functions for XMTP inbox IDs
 */
export class Utils extends UtilsWorkerClass {
  /**
   * Creates a new Utils instance
   *
   * @param enableLogging - Optional flag to enable logging
   */
  constructor(enableLogging?: boolean) {
    const worker = new Worker(new URL("./workers/utils", import.meta.url), {
      type: "module",
    });
    super(worker, enableLogging ?? false);
  }

  /**
   * Generates an inbox ID for a given identifier
   *
   * @param identifier - The identifier to generate an inbox ID for
   * @returns Promise that resolves with the generated inbox ID
   */
  async generateInboxId(identifier: Identifier) {
    return this.sendMessage("generateInboxId", {
      identifier,
    });
  }

  /**
   * Gets the inbox ID for a specific identifier and optional environment
   *
   * @param identifier - The identifier to get the inbox ID for
   * @param env - Optional XMTP environment configuration (default: "dev")
   * @returns Promise that resolves with the inbox ID for the identifier
   */
  async getInboxIdForIdentifier(identifier: Identifier, env?: XmtpEnv) {
    return this.sendMessage("getInboxIdForIdentifier", {
      identifier,
      env,
    });
  }
}
