import { fetcher, frames } from "@xmtp/proto"
import { Signature, SignedPublicKeyBundle } from "@xmtp/xmtp-js"

import { sha256 } from "./crypto.js"
import {
  UntrustedData,
  XmtpOpenFramesRequest,
  XmtpValidationResponse,
} from "./types.js"
export * from "./types.js"

const { b64Decode } = fetcher

export async function validateFramesPost(
  data: XmtpOpenFramesRequest,
): Promise<XmtpValidationResponse> {
  const { untrustedData, trustedData } = data
  const { walletAddress } = untrustedData
  const { messageBytes: messageBytesString } = trustedData

  const messageBytes = b64Decode(messageBytesString)

  const { actionBody, actionBodyBytes, signature, signedPublicKeyBundle } =
    deserializeProtoMessage(messageBytes)

  const verifiedWalletAddress = await getVerifiedWalletAddress(
    actionBodyBytes,
    signature,
    signedPublicKeyBundle,
  )

  if (verifiedWalletAddress !== walletAddress) {
    throw new Error("Invalid wallet address")
  }

  await checkUntrustedData(untrustedData, actionBody)

  return {
    actionBody,
    verifiedWalletAddress,
  }
}

export function deserializeProtoMessage(messageBytes: Uint8Array) {
  const frameAction = frames.FrameAction.decode(messageBytes)
  if (!frameAction.signature || !frameAction.signedPublicKeyBundle) {
    throw new Error(
      "Invalid frame action: missing signature or signed public key bundle",
    )
  }
  const actionBody = frames.FrameActionBody.decode(frameAction.actionBody)

  return {
    actionBody,
    actionBodyBytes: frameAction.actionBody,
    signature: new Signature(frameAction.signature),
    signedPublicKeyBundle: new SignedPublicKeyBundle(
      frameAction.signedPublicKeyBundle,
    ),
  }
}

async function getVerifiedWalletAddress(
  actionBodyBytes: Uint8Array,
  signature: Signature,
  signedPublicKeyBundle: SignedPublicKeyBundle,
): Promise<string> {
  const isValid = signedPublicKeyBundle.identityKey.verify(
    signature,
    await sha256(actionBodyBytes),
  )

  if (!isValid) {
    throw new Error("Invalid signature")
  }

  return signedPublicKeyBundle.walletSignatureAddress()
}

async function checkUntrustedData(
  { url, buttonIndex, opaqueConversationIdentifier, timestamp }: UntrustedData,
  actionBody: frames.FrameActionBody,
) {
  if (actionBody.frameUrl !== url) {
    throw new Error("Mismatched URL")
  }

  if (actionBody.buttonIndex !== buttonIndex) {
    throw new Error("Mismatched button index")
  }

  if (
    actionBody.opaqueConversationIdentifier !== opaqueConversationIdentifier
  ) {
    throw new Error("Mismatched conversation identifier")
  }

  if (actionBody.timestamp.toNumber() !== timestamp) {
    throw new Error("Mismatched timestamp")
  }
}
