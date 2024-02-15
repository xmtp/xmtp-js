import { Client, Signature, SignedPublicKey } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { frames, fetcher } from "@xmtp/proto";
import { it, expect, describe, beforeEach } from "vitest";
import { sha256 } from "@noble/hashes/sha256";
import { FramesClient } from ".";

const { b64Decode } = fetcher;

describe("signFrameAction", () => {
  let client: Client;
  let framesClient: FramesClient;
  beforeEach(async () => {
    client = await Client.create(Wallet.createRandom());
    framesClient = new FramesClient(client);
  });
  it("should sign a frame action with a valid signature", async () => {
    const frameUrl = "https://example.com";
    const buttonIndex = 1;

    const signedPayload = await framesClient.signFrameAction({
      frameUrl,
      buttonIndex,
      conversationTopic: "foo",
      participantAccountAddresses: ["amal", "bola"],
    });

    expect(signedPayload.untrustedData.walletAddress).toEqual(client.address);
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
    expect(signedPayloadProto.signature).toBeDefined();
    expect(signedPayloadProto.signedPublicKeyBundle).toBeDefined();

    const signedPayloadBody = frames.FrameActionBody.decode(
      signedPayloadProto.actionBody,
    );

    expect(signedPayloadBody.buttonIndex).toEqual(buttonIndex);
    expect(signedPayloadBody.frameUrl).toEqual(frameUrl);
    expect(signedPayloadBody.opaqueConversationIdentifier).toBeDefined();

    if (
      !signedPayloadProto.signature ||
      !signedPayloadProto?.signedPublicKeyBundle?.identityKey
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
  });

  // Will add E2E tests back once we have Frames deployed with the new schema
  it("works e2e", async () => {
    const frameUrl =
      "https://fc-polls-five.vercel.app/polls/01032f47-e976-42ee-9e3d-3aac1324f4b8";

    const metadata = await framesClient.proxy.readMetadata(frameUrl);
    expect(metadata).toBeDefined();
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
  });
});
