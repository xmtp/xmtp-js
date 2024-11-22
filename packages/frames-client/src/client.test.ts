import { getRandomValues } from "node:crypto";
import { sha256 } from "@noble/hashes/sha256";
import { Client as V3Client } from "@xmtp/node-sdk";
import { fetcher, frames } from "@xmtp/proto";
import { Client, Signature, SignedPublicKey } from "@xmtp/xmtp-js";
import { getBytes, Wallet } from "ethers";
import { uint8ArrayToHex } from "uint8array-extras";
import { describe, expect, it } from "vitest";
import { FramesClient } from "./client";
import {
  isV3FramesSigner,
  type FramesSigner,
  type V2FramesSigner,
  type V3FramesSigner,
} from "./types";

const { b64Decode } = fetcher;

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
      client.signWithInstallationKey(uint8ArrayToHex(digest)),
  };
  const framesClient = new FramesClient(signer);
  return { signer, framesClient };
};

const shouldSignFrameActionWithValidSignature =
  (signer: FramesSigner, framesClient: FramesClient) => async () => {
    const frameUrl = "https://example.com";
    const buttonIndex = 1;

    const signedPayload = await framesClient.signFrameAction({
      frameUrl,
      buttonIndex,
      conversationTopic: "foo",
      participantAccountAddresses: ["amal", "bola"],
      state: "state",
      address: "0x...",
      transactionId: "123",
    });

    // Below addresses are typically the same but can technically be different
    // walletAddress references address of XMTP client
    expect(signedPayload.untrustedData.walletAddress).toEqual(
      await signer.address(),
    );

    // address references the address associated with initiating a transaction
    expect(signedPayload.untrustedData.address).toEqual("0x...");
    expect(signedPayload.untrustedData.transactionId).toEqual("123");

    expect(signedPayload.untrustedData.url).toEqual(frameUrl);
    expect(signedPayload.untrustedData.buttonIndex).toEqual(buttonIndex);
    expect(
      signedPayload.untrustedData.opaqueConversationIdentifier,
    ).toBeDefined();
    expect(signedPayload.untrustedData.timestamp).toBeGreaterThan(0);

    const signedPayloadProto = frames.FrameAction.decode(
      b64Decode(signedPayload.trustedData.messageBytes),
    );
    expect(signedPayloadProto.actionBody).toBeDefined();

    if (isV3FramesSigner(signer)) {
      expect(signedPayloadProto.signature).toBeUndefined();
      expect(signedPayloadProto.signedPublicKeyBundle).toBeUndefined();
    } else {
      expect(signedPayloadProto.signature).toBeDefined();
      expect(signedPayloadProto.signedPublicKeyBundle).toBeDefined();

      if (
        !signedPayloadProto.signature ||
        !signedPayloadProto.signedPublicKeyBundle?.identityKey
      ) {
        throw new Error("Missing signature");
      }

      const signatureInstance = new Signature(signedPayloadProto.signature);
      const digest = sha256(signedPayloadProto.actionBody);
      // Ensure the signature is valid
      expect(
        signatureInstance
          .getPublicKey(digest)
          ?.equals(
            new SignedPublicKey(
              signedPayloadProto.signedPublicKeyBundle.identityKey,
            ).toLegacyKey(),
          ),
      );
    }

    const signedPayloadBody = frames.FrameActionBody.decode(
      signedPayloadProto.actionBody,
    );

    expect(signedPayloadBody.buttonIndex).toEqual(buttonIndex);
    expect(signedPayloadBody.frameUrl).toEqual(frameUrl);
    expect(signedPayloadBody.opaqueConversationIdentifier).toBeDefined();
    expect(signedPayloadBody.state).toEqual("state");
  };

// Will add E2E tests back once we have Frames deployed with the new schema
const worksE2E = (framesClient: FramesClient) => async () => {
  const frameUrl =
    "https://fc-polls-five.vercel.app/polls/01032f47-e976-42ee-9e3d-3aac1324f4b8";
  const metadata = await framesClient.proxy.readMetadata(frameUrl);
  expect(metadata).toBeDefined();
  expect(metadata.frameInfo).toMatchObject({
    acceptedClients: {
      farcaster: "vNext",
    },
    buttons: {
      "1": {
        label: "Yes",
      },
      "2": {
        label: "No",
      },
    },
    image: {
      content:
        "https://fc-polls-five.vercel.app/api/image?id=01032f47-e976-42ee-9e3d-3aac1324f4b8",
    },
    postUrl:
      "https://fc-polls-five.vercel.app/api/vote?id=01032f47-e976-42ee-9e3d-3aac1324f4b8",
  });
  const signedPayload = await framesClient.signFrameAction({
    frameUrl,
    buttonIndex: 1,
    conversationTopic: "foo",
    participantAccountAddresses: ["amal", "bola"],
  });
  const postUrl = metadata.extractedTags["fc:frame:post_url"];
  const response = await framesClient.proxy.post(postUrl, signedPayload);
  expect(response).toBeDefined();
  expect(response.extractedTags["fc:frame"]).toEqual("vNext");

  const imageUrl = response.extractedTags["fc:frame:image"];
  const mediaUrl = framesClient.proxy.mediaUrl(imageUrl);

  const downloadedMedia = await fetch(mediaUrl);
  expect(downloadedMedia.ok).toBeTruthy();
  expect(downloadedMedia.headers.get("content-type")).toEqual("image/png");
};

const sendsBackButtonPostUrl = (framesClient: FramesClient) => async () => {
  const frameUrl =
    "https://tx-boilerplate-frame-git-main-xmtp-labs.vercel.app/";
  const metadata = await framesClient.proxy.readMetadata(frameUrl);
  expect(metadata).toBeDefined();
  expect(metadata.frameInfo).toMatchObject({
    acceptedClients: {
      xmtp: "2024-02-09",
      farcaster: "vNext",
    },
    buttons: {
      "1": {
        label: "Make transaction",
        action: "tx",
        target:
          "https://tx-boilerplate-frame-git-main-xmtp-labs.vercel.app/api/transaction",
        postUrl:
          "https://tx-boilerplate-frame-git-main-xmtp-labs.vercel.app/api/transaction-success",
      },
    },
    image: {
      content:
        "https://tx-boilerplate-frame-git-main-xmtp-labs.vercel.app/api/og?transaction=null",
    },
  });
};

describe("FramesClient", () => {
  describe.concurrent("signFrameAction", () => {
    describe("V2", () => {
      it("should sign a frame action with a valid signature", async () => {
        const { signer, framesClient } = await getV2Setup();
        await shouldSignFrameActionWithValidSignature(signer, framesClient)();
      });

      it("works e2e", async () => {
        const { framesClient } = await getV2Setup();
        await worksE2E(framesClient)();
      });

      it("sends back the button postUrl for a tx frame in frame info", async () => {
        const { framesClient } = await getV2Setup();
        await sendsBackButtonPostUrl(framesClient)();
      });
    });

    describe("V3", () => {
      it("should sign a frame action with a valid signature", async () => {
        const { signer, framesClient } = await getV3Setup();
        await shouldSignFrameActionWithValidSignature(signer, framesClient)();
      });

      it("sends back the button postUrl for a tx frame in frame info", async () => {
        const { framesClient } = await getV3Setup();
        await sendsBackButtonPostUrl(framesClient)();
      });
    });
  });
});
