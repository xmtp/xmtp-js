import init, {
  applySignatureRequest,
  revokeInstallationsSignatureRequest,
  type Backend,
  type Identifier,
  type SignatureRequestHandle,
} from "@xmtp/wasm-bindings";
import type { Signer } from "@/utils/signer";

/**
 * Creates signature text for revoking installations
 *
 * WARNING: This function should be used with caution. It is only provided
 * for use in special cases where the provided workflows do not meet the
 * requirements of an application.
 *
 * It is highly recommended to use the `revokeInstallations` function instead.
 *
 * @param backend - The Backend instance for API communication
 * @param identifier - The identifier to revoke installations for
 * @param inboxId - The inbox ID to revoke installations for
 * @param installationIds - The installation IDs to revoke
 * @returns The signature text and signature request ID
 */
export const revokeInstallationsSignatureText = async (
  backend: Backend,
  identifier: Identifier,
  inboxId: string,
  installationIds: Uint8Array[],
): Promise<{
  signatureText: string;
  signatureRequest: SignatureRequestHandle;
}> => {
  await init();
  const signatureRequest = revokeInstallationsSignatureRequest(
    backend,
    identifier,
    inboxId,
    installationIds,
  );
  const signatureText = await signatureRequest.signatureText();
  return { signatureText, signatureRequest };
};

/**
 * Revokes installations for a given inbox ID
 *
 * @param backend - The Backend instance for API communication
 * @param signer - The signer to use
 * @param inboxId - The inbox ID to revoke installations for
 * @param installationIds - The installation IDs to revoke
 * @returns Promise that resolves when the revoke installations operation is complete
 */
export const revokeInstallations = async (
  backend: Backend,
  signer: Signer,
  inboxId: string,
  installationIds: Uint8Array[],
): Promise<void> => {
  await init();
  const identifier = await signer.getIdentifier();
  const { signatureText, signatureRequest } =
    await revokeInstallationsSignatureText(
      backend,
      identifier,
      inboxId,
      installationIds,
    );
  const signature = await signer.signMessage(signatureText);

  switch (signer.type) {
    case "EOA":
      await signatureRequest.addEcdsaSignature(signature);
      break;
    case "SCW":
      await signatureRequest.addScwSignature(
        identifier,
        signature,
        signer.getChainId(),
        signer.getBlockNumber?.(),
      );
      break;
  }

  await applySignatureRequest(backend, signatureRequest);
};
