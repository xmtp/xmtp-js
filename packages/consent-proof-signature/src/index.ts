import Long from "long";
import { invitation } from "@xmtp/proto";
/**
 *
 * @param peerAddress - Ethereum address of the broadcaster
 * @param timestampMs - Timestamp in milliseconds used in the signature
 * @returns
 */
export const createConsentMessage = (
  peerAddress: string,
  timestampMs: number,
): string =>
  "XMTP : Grant inbox consent to sender\n" +
  "\n" +
  `Current Time: ${new Date(timestampMs).toUTCString()}\n` +
  `From Address: ${peerAddress}\n` +
  "\n" +
  "For more info: https://xmtp.org/signatures/";

/**
 *
 * @param signature hex string of the signature
 * @param timestampMs timestamp in milliseconds used in the signature
 * @returns Uint8Array of the consent proof payload
 */
export const createConsentProofPayload = (
  signature: string,
  timestampMs: number,
): Uint8Array =>
  invitation.ConsentProofPayload.encode({
    signature,
    timestamp: Long.fromNumber(timestampMs),
    payloadVersion:
      invitation.ConsentProofPayloadVersion.CONSENT_PROOF_PAYLOAD_VERSION_1,
  }).finish();
