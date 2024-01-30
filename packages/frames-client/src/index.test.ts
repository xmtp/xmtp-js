import { Client, Signature, SignedPublicKey } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { frames, fetcher } from "@xmtp/proto";
import { it, expect, describe, beforeEach } from "vitest";
import { FramesClient } from ".";
import { sha256 } from "./utils";

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
    const conversationIdentifier = "testConversationIdentifier";
    const messageId = "testMessageId";

    const signedPayload = await framesClient.signFrameAction(
      frameUrl,
      buttonIndex,
      conversationIdentifier,
      messageId,
    );

    expect(signedPayload.untrustedData.walletAddress).toEqual(client.address);
    expect(signedPayload.untrustedData.url).toEqual(frameUrl);
    expect(signedPayload.untrustedData.buttonIndex).toEqual(buttonIndex);
    expect(signedPayload.untrustedData.conversationIdentifier).toEqual(
      conversationIdentifier,
    );
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
    expect(signedPayloadBody.messageId).toEqual(messageId);
    expect(new TextDecoder().decode(signedPayloadBody.buttonIndex)).toEqual(
      buttonIndex.toString(),
    );
    expect(new TextDecoder().decode(signedPayloadBody.frameUrl)).toEqual(
      frameUrl,
    );
    expect(signedPayloadBody.conversationIdentifier).toEqual(
      conversationIdentifier,
    );
    expect(new TextDecoder().decode(signedPayloadBody.frameUrl)).toEqual(
      frameUrl,
    );

    if (
      !signedPayloadProto.signature ||
      !signedPayloadProto?.signedPublicKeyBundle?.identityKey
    ) {
      throw new Error("Missing signature");
    }

    const signatureInstance = new Signature(signedPayloadProto.signature);
    const digest = await sha256(signedPayloadProto.actionBody);
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
});
