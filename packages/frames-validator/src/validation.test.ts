import { getRandomValues } from "node:crypto";
import {
  FramesClient,
  isV3FramesSigner,
  type FramesSigner,
  type V2FramesSigner,
  type V3FramesSigner,
} from "@xmtp/frames-client";
import { Client as V3Client } from "@xmtp/node-sdk";
import { fetcher, frames } from "@xmtp/proto";
import { Client, PrivateKeyBundleV2 } from "@xmtp/xmtp-js";
import { getBytes, Wallet } from "ethers";
import { describe, expect, it } from "vitest";
import { deserializeProtoMessage, validateFramesPost } from ".";

const { b64Decode, b64Encode } = fetcher;

function scrambleBytes(bytes: Uint8Array) {
  const scrambled = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    scrambled[i] = bytes[bytes.length - i - 1];
  }
  return scrambled;
}

const getV2Setup = async () => {
  const client = await Client.create(Wallet.createRandom(), { env: "local" });
  const signer: V2FramesSigner = {
    address: () => client.address,
    getPublicKeyBundle: () => client.keystore.getPublicKeyBundle(),
    sign: (digest: Uint8Array) =>
      client.keystore.signDigest({
        digest,
        identityKey: true,
        prekeyIndex: undefined,
      }),
  };
  const framesClient = new FramesClient(signer);
  return { signer, framesClient };
};

const getV3Setup = async () => {
  const encryptionKey = getRandomValues(new Uint8Array(32));
  const wallet = Wallet.createRandom();
  const client = await V3Client.create(
    {
      getAddress: () => wallet.address,
      signMessage: async (message: string) =>
        getBytes(await wallet.signMessage(message)),
    },
    encryptionKey,
    { env: "local" },
  );
  const signer: V3FramesSigner = {
    address: () => client.accountAddress,
    installationId: () => client.installationIdBytes,
    inboxId: () => client.inboxId,
    sign: (digest: Uint8Array) =>
      client.signWithInstallationKey(Buffer.from(digest).toString("hex")),
  };
  const framesClient = new FramesClient(signer);
  return { signer, framesClient };
};

const FRAME_URL = "https://frame.xyz";
const CONVERSATION_TOPIC = "/xmtp/0/1234";
const PARTICIPANT_ACCOUNT_ADDRESSES = ["0x1234", "0x5678"];
const BUTTON_INDEX = 2;

const shouldValidateFramesPost =
  (signer: FramesSigner, framesClient: FramesClient) => async () => {
    const postData = await framesClient.signFrameAction({
      buttonIndex: BUTTON_INDEX,
      frameUrl: FRAME_URL,
      conversationTopic: CONVERSATION_TOPIC,
      participantAccountAddresses: PARTICIPANT_ACCOUNT_ADDRESSES,
    });
    const validated = await validateFramesPost(postData, "local");
    expect(validated.verifiedWalletAddress).toEqual(await signer.address());
  };

const shouldFailWithInvalidSignature =
  (signer: FramesSigner, framesClient: FramesClient) => async () => {
    const postData = await framesClient.signFrameAction({
      buttonIndex: BUTTON_INDEX,
      frameUrl: FRAME_URL,
      conversationTopic: CONVERSATION_TOPIC,
      participantAccountAddresses: PARTICIPANT_ACCOUNT_ADDRESSES,
    });
    const deserialized = deserializeProtoMessage(
      b64Decode(postData.trustedData.messageBytes),
    );

    const isV3 = isV3FramesSigner(signer);

    if (isV3) {
      deserialized.installationSignature = scrambleBytes(
        deserialized.installationSignature,
      );
    } else {
      if (!deserialized.signature?.ecdsaCompact?.bytes) {
        throw new Error("Signature bytes are empty");
      }

      deserialized.signature.ecdsaCompact.bytes = scrambleBytes(
        deserialized.signature.ecdsaCompact.bytes,
      );
    }

    const reserialized = frames.FrameAction.encode({
      actionBody: deserialized.actionBodyBytes,
      signature: isV3 ? undefined : deserialized.signature,
      signedPublicKeyBundle: isV3
        ? undefined
        : deserialized.signedPublicKeyBundle,
      installationSignature: isV3
        ? deserialized.installationSignature
        : new Uint8Array(),
      installationId: isV3 ? deserialized.installationId : new Uint8Array(),
      inboxId: isV3 ? deserialized.inboxId : "",
    }).finish();

    postData.trustedData.messageBytes = b64Encode(
      reserialized,
      0,
      reserialized.length,
    );

    await expect(() => validateFramesPost(postData, "local")).rejects.toThrow();
  };

const shouldFailWithWalletAddressMismatch =
  (signer: FramesSigner, framesClient: FramesClient) => async () => {
    const postData = await framesClient.signFrameAction({
      buttonIndex: BUTTON_INDEX,
      frameUrl: FRAME_URL,
      conversationTopic: CONVERSATION_TOPIC,
      participantAccountAddresses: PARTICIPANT_ACCOUNT_ADDRESSES,
    });
    const deserialized = deserializeProtoMessage(
      b64Decode(postData.trustedData.messageBytes),
    );

    const isV3 = isV3FramesSigner(signer);

    if (isV3) {
      deserialized.inboxId = "wrong-inbox-id";
    } else {
      const throwAwayWallet = Wallet.createRandom();
      deserialized.signedPublicKeyBundle = (
        await PrivateKeyBundleV2.generate(throwAwayWallet)
      ).getPublicKeyBundle();
    }

    const reserialized = frames.FrameAction.encode({
      actionBody: deserialized.actionBodyBytes,
      signature: isV3 ? undefined : deserialized.signature,
      signedPublicKeyBundle: isV3
        ? undefined
        : deserialized.signedPublicKeyBundle,
      installationSignature: isV3
        ? deserialized.installationSignature
        : new Uint8Array(),
      installationId: isV3 ? deserialized.installationId : new Uint8Array(),
      inboxId: isV3 ? deserialized.inboxId : "",
    }).finish();

    postData.trustedData.messageBytes = b64Encode(
      reserialized,
      0,
      reserialized.length,
    );

    await expect(() => validateFramesPost(postData, "local")).rejects.toThrow();
  };

describe("validations", () => {
  describe("V2", () => {
    it("succeeds in the happy path", async () => {
      const { signer, framesClient } = await getV2Setup();
      await shouldValidateFramesPost(signer, framesClient)();
    });

    it("fails if the signature verification fails", async () => {
      const { signer, framesClient } = await getV2Setup();
      await shouldFailWithInvalidSignature(signer, framesClient)();
    });

    it("fails if the wallet address doesn't match", async () => {
      const { signer, framesClient } = await getV2Setup();
      await shouldFailWithWalletAddressMismatch(signer, framesClient)();
    });
  });

  describe("V3", () => {
    it("succeeds in the happy path", async () => {
      const { signer, framesClient } = await getV3Setup();
      await shouldValidateFramesPost(signer, framesClient)();
    });

    it("fails if the signature verification fails", async () => {
      const { signer, framesClient } = await getV3Setup();
      await shouldFailWithInvalidSignature(signer, framesClient)();
    });

    it("fails if the wallet address doesn't match", async () => {
      const { signer, framesClient } = await getV3Setup();
      await shouldFailWithWalletAddressMismatch(signer, framesClient)();
    });
  });
});
