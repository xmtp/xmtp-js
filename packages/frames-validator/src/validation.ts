import { getRandomValues } from "crypto";
import { sha256 } from "@noble/hashes/sha256";
import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import { fetcher, frames, type publicKey, type signature } from "@xmtp/proto";
import { getBytes, Wallet } from "ethers";
import { uint8ArrayToHex } from "uint8array-extras";
import type {
  UntrustedData,
  XmtpOpenFramesRequest,
  XmtpValidationResponse,
} from "./types.js";
import { verifyIdentityKeySignature, verifyWalletSignature } from "./utils.js";

export type * from "./types.js";

const { b64Decode } = fetcher;

export async function validateFramesPost(
  data: XmtpOpenFramesRequest,
  env?: XmtpEnv,
): Promise<XmtpValidationResponse> {
  const { untrustedData, trustedData } = data;
  const { walletAddress } = untrustedData;
  const { messageBytes: messageBytesString } = trustedData;

  const messageBytes = b64Decode(messageBytesString);

  const {
    actionBody,
    actionBodyBytes,
    signature,
    signedPublicKeyBundle,
    installationId,
    installationSignature,
    inboxId,
  } = deserializeProtoMessage(messageBytes);

  const isV2Frame = signature && signedPublicKeyBundle;

  if (isV2Frame) {
    const verifiedWalletAddress = getVerifiedWalletAddress(
      actionBodyBytes,
      signature,
      signedPublicKeyBundle,
    );

    if (verifiedWalletAddress !== walletAddress) {
      console.log(`${verifiedWalletAddress} !== ${walletAddress}`);
      throw new Error("Invalid wallet address");
    }
  } else {
    let randomWallet = Wallet.createRandom();
    const encryptionKey = getRandomValues(new Uint8Array(32));
    const client = await Client.create(
      {
        getAddress: () => randomWallet.address,
        signMessage: async (message: string) =>
          getBytes(await randomWallet.signMessage(message)),
      },
      encryptionKey,
    );

    // make sure inbox IDs match
    const authorized = await client.isInstallationAuthorized(
      inboxId,
      installationId,
    );
    if (!authorized) {
      throw new Error("Installation not a member of association state");
    }

    const isMember = await client.isAddressAuthorized(inboxId, walletAddress);

    if (!isMember) {
      throw new Error("Unable to associate wallet address with inbox");
    }

    const digest = sha256(actionBodyBytes);

    // make sure installation signature is valid
    const valid = Client.verifySignedWithPublicKey(
      uint8ArrayToHex(digest),
      installationSignature,
      installationId,
    );

    if (!valid) {
      throw new Error("Invalid signature");
    }
  }

  checkUntrustedData(untrustedData, actionBody);

  return {
    actionBody,
    verifiedWalletAddress: walletAddress,
  };
}

export function deserializeProtoMessage(messageBytes: Uint8Array) {
  const frameAction = frames.FrameAction.decode(messageBytes);
  const actionBody = frames.FrameActionBody.decode(frameAction.actionBody);

  return {
    actionBody,
    actionBodyBytes: frameAction.actionBody,
    signature: frameAction.signature,
    signedPublicKeyBundle: frameAction.signedPublicKeyBundle,
    installationId: frameAction.installationId,
    installationSignature: frameAction.installationSignature,
    inboxId: frameAction.inboxId,
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
