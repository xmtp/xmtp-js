import { fetcher, frames, publicKey, signature } from "@xmtp/proto"

import {
  UntrustedData,
  XmtpOpenFramesRequest,
  XmtpValidationResponse,
} from "./types.js"
import { verifyIdentityKeySignature, verifyWalletSignature } from "./utils.js"
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
    console.log(`${verifiedWalletAddress} !== ${walletAddress}`)
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
    signature: frameAction.signature,
    signedPublicKeyBundle: frameAction.signedPublicKeyBundle,
  }
}

async function getVerifiedWalletAddress(
  actionBodyBytes: Uint8Array,
  signature: signature.Signature,
  signedPublicKeyBundle: publicKey.SignedPublicKeyBundle,
): Promise<string> {
  const walletAddress = await verifyWalletSignature(signedPublicKeyBundle)
  verifyIdentityKeySignature(actionBodyBytes, signature, signedPublicKeyBundle)

  return walletAddress
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
