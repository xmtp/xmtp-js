import { fetcher, frames, type publicKey, type signature } from "@xmtp/proto";
import type {
  UntrustedData,
  XmtpOpenFramesRequest,
  XmtpValidationResponse,
} from "./types.js";
import { verifyIdentityKeySignature, verifyWalletSignature } from "./utils.js";

export type * from "./types.js";

const { b64Decode } = fetcher;

export function validateFramesPost(
  data: XmtpOpenFramesRequest,
): XmtpValidationResponse {
  const { untrustedData, trustedData } = data;
  const { walletAddress } = untrustedData;
  const { messageBytes: messageBytesString } = trustedData;

  const messageBytes = b64Decode(messageBytesString);

  const { actionBody, actionBodyBytes, signature, signedPublicKeyBundle } =
    deserializeProtoMessage(messageBytes);

  const verifiedWalletAddress = getVerifiedWalletAddress(
    actionBodyBytes,
    signature,
    signedPublicKeyBundle,
  );

  if (verifiedWalletAddress !== walletAddress) {
    console.log(`${verifiedWalletAddress} !== ${walletAddress}`);
    throw new Error("Invalid wallet address");
  }

  checkUntrustedData(untrustedData, actionBody);

  return {
    actionBody,
    verifiedWalletAddress,
  };
}

export function deserializeProtoMessage(messageBytes: Uint8Array) {
  const frameAction = frames.FrameAction.decode(messageBytes);
  if (!frameAction.signature || !frameAction.signedPublicKeyBundle) {
    throw new Error(
      "Invalid frame action: missing signature or signed public key bundle",
    );
  }
  const actionBody = frames.FrameActionBody.decode(frameAction.actionBody);

  return {
    actionBody,
    actionBodyBytes: frameAction.actionBody,
    signature: frameAction.signature,
    signedPublicKeyBundle: frameAction.signedPublicKeyBundle,
  };
}

function getVerifiedWalletAddress(
  actionBodyBytes: Uint8Array,
  signature: signature.Signature,
  signedPublicKeyBundle: publicKey.SignedPublicKeyBundle,
): string {
  const walletAddress = verifyWalletSignature(signedPublicKeyBundle);
  verifyIdentityKeySignature(actionBodyBytes, signature, signedPublicKeyBundle);

  return walletAddress;
}

function checkUntrustedData(
  {
    url,
    buttonIndex,
    opaqueConversationIdentifier,
    timestamp,
    state = "",
    inputText = "",
  }: UntrustedData,
  actionBody: frames.FrameActionBody,
) {
  if (actionBody.frameUrl !== url) {
    throw new Error("Mismatched URL");
  }

  if (actionBody.buttonIndex !== buttonIndex) {
    throw new Error("Mismatched button index");
  }

  if (
    actionBody.opaqueConversationIdentifier !== opaqueConversationIdentifier
  ) {
    throw new Error("Mismatched conversation identifier");
  }

  if (actionBody.timestamp.toNumber() !== timestamp) {
    throw new Error("Mismatched timestamp");
  }

  if (actionBody.state !== state) {
    throw new Error("Mismatched state");
  }

  if (actionBody.inputText !== inputText) {
    throw new Error("Missing input text");
  }
}
