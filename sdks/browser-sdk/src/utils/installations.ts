import init, {
  applySignatureRequest,
  revokeInstallationsSignatureRequest,
  type Identifier,
  type SignatureRequestHandle,
} from "@xmtp/wasm-bindings";
import { ApiUrls } from "@/constants";
import type { XmtpEnv } from "@/types/options";
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
 * @param identifier - The identifier to revoke installations for
 * @param inboxId - The inbox ID to revoke installations for
 * @param installationIds - The installation IDs to revoke
 * @param env - Optional XMTP environment configuration (default: "dev")
 * @param gatewayHost - Optional gateway host override
 * @returns The signature text and signature request ID
 */
export const revokeInstallationsSignatureText = async (
  identifier: Identifier,
  inboxId: string,
  installationIds: Uint8Array[],
  env?: XmtpEnv,
  gatewayHost?: string,
): Promise<{
  signatureText: string;
  signatureRequest: SignatureRequestHandle;
}> => {
  await init();
  const host = ApiUrls[env ?? "dev"];
  const signatureRequest = revokeInstallationsSignatureRequest(
    host,
    gatewayHost ?? null,
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
 * @param signer - The signer to use
 * @param inboxId - The inbox ID to revoke installations for
 * @param installationIds - The installation IDs to revoke
 * @param env - Optional XMTP environment configuration (default: "dev")
 * @param gatewayHost - Optional gateway host override
 * @returns Promise that resolves when the revoke installations operation is complete
 */
export const revokeInstallations = async (
  signer: Signer,
  inboxId: string,
  installationIds: Uint8Array[],
  env?: XmtpEnv,
  gatewayHost?: string,
): Promise<void> => {
  await init();
  const identifier = await signer.getIdentifier();
  const { signatureText, signatureRequest } =
    await revokeInstallationsSignatureText(
      identifier,
      inboxId,
      installationIds,
      env,
      gatewayHost,
    );
  const signature = await signer.signMessage(signatureText);
  const host = ApiUrls[env ?? "dev"];

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

  await applySignatureRequest(host, gatewayHost ?? null, signatureRequest);
};
