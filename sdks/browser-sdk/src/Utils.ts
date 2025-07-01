import type { Identifier } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import type { XmtpEnv } from "@/types/options";
import { toSafeSigner, type Signer } from "@/utils/signer";
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
    return this.sendMessage("utils.generateInboxId", {
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
    return this.sendMessage("utils.getInboxIdForIdentifier", {
      identifier,
      env,
    });
  }

  /**
   * Creates signature text for revoking installations
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `revokeInstallations` method instead.
   *
   * @param env - The environment to use
   * @param identifier - The identifier to revoke installations for
   * @param inboxId - The inbox ID to revoke installations for
   * @param installationIds - The installation IDs to revoke
   * @returns The signature text and signature request ID
   */
  async revokeInstallationsSignatureText(
    identifier: Identifier,
    inboxId: string,
    installationIds: Uint8Array[],
    env?: XmtpEnv,
  ) {
    return this.sendMessage("utils.revokeInstallationsSignatureText", {
      env,
      identifier,
      inboxId,
      installationIds,
      signatureRequestId: v4(),
    });
  }

  /**
   * Revokes installations for a given inbox ID
   *
   * @param env - The environment to use
   * @param signer - The signer to use
   * @param inboxId - The inbox ID to revoke installations for
   * @param installationIds - The installation IDs to revoke
   * @returns Promise that resolves with the result of the revoke installations operation
   */
  async revokeInstallations(
    signer: Signer,
    inboxId: string,
    installationIds: Uint8Array[],
    env?: XmtpEnv,
  ) {
    const identifier = await signer.getIdentifier();
    const { signatureText, signatureRequestId } =
      await this.revokeInstallationsSignatureText(
        identifier,
        inboxId,
        installationIds,
        env,
      );
    const signature = await signer.signMessage(signatureText);
    const safeSigner = await toSafeSigner(signer, signature);

    return this.sendMessage("utils.revokeInstallations", {
      signer: safeSigner,
      signatureRequestId,
      env,
    });
  }

  /**
   * Gets the inbox state for the specified inbox IDs without a client
   *
   * @param inboxIds - The inbox IDs to get the state for
   * @param env - The environment to use
   * @returns The inbox state for the specified inbox IDs
   */
  async inboxStateFromInboxIds(inboxIds: string[], env?: XmtpEnv) {
    return this.sendMessage("utils.inboxStateFromInboxIds", {
      inboxIds,
      env,
    });
  }
}
