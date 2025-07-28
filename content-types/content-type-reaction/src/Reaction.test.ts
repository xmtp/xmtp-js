import type { EncodedContent } from "@xmtp/content-type-primitives";
import { Client, IdentifierKind, type Signer } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  ContentTypeReaction,
  ReactionCodec,
  type LegacyReactionParameters,
  type Reaction,
} from "./Reaction";

export const createSigner = (): Signer => {
  const account = privateKeyToAccount(generatePrivateKey());
  const wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifierKind: IdentifierKind.Ethereum,
      identifier: account.address.toLowerCase(),
    }),
    signMessage: async (message: string) => {
      const signature = await wallet.signMessage({
        message,
      });
      return toBytes(signature);
    },
  };
};

describe("ReactionContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReaction.authorityId).toBe("xmtp.org");
    expect(ContentTypeReaction.typeId).toBe("reaction");
    expect(ContentTypeReaction.versionMajor).toBe(1);
    expect(ContentTypeReaction.versionMinor).toBe(0);
  });

  it("supports canonical and legacy form", () => {
    const codec = new ReactionCodec();

    // This is how clients send reactions now.
    const canonicalEncoded: EncodedContent<LegacyReactionParameters> = {
      parameters: {
        action: "added",
        reference: "abc123",
        schema: "shortcode",
        encoding: "UTF-8",
      },
      type: ContentTypeReaction,
      content: new TextEncoder().encode(
        JSON.stringify({
          action: "added",
          content: "smile",
          reference: "abc123",
          schema: "shortcode",
        }),
      ),
    };

    // Previously, some clients sent reactions like this.
    // So we test here to make sure we can still decode them.
    const legacyEncoded: EncodedContent<LegacyReactionParameters> = {
      type: ContentTypeReaction,
      parameters: {
        action: "added",
        reference: "abc123",
        schema: "shortcode",
        encoding: "UTF-8",
      },
      content: new TextEncoder().encode("smile"),
    };

    const canonical = codec.decode(canonicalEncoded);
    const legacy = codec.decode(legacyEncoded);
    expect(canonical.action).toBe("added");
    expect(legacy.action).toBe("added");
    expect(canonical.content).toBe("smile");
    expect(legacy.content).toBe("smile");
    expect(canonical.reference).toBe("abc123");
    expect(legacy.reference).toBe("abc123");
    expect(canonical.schema).toBe("shortcode");
    expect(legacy.schema).toBe("shortcode");
  });

  it("can send a reaction", async () => {
    const signer1 = createSigner();
    const client1 = await Client.create(signer1, {
      codecs: [new ReactionCodec()],
      env: "local",
    });

    const signer2 = createSigner();
    const client2 = await Client.create(signer2, {
      codecs: [new ReactionCodec()],
      env: "local",
    });

    const dm = await client1.conversations.newDm(client2.inboxId);

    const originalMessage = await dm.send("test");

    const reaction: Reaction = {
      action: "added",
      content: "smile",
      reference: originalMessage,
      schema: "shortcode",
    };

    await dm.send(reaction, ContentTypeReaction);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();

    expect(dms.length).toBe(1);

    await dms[0].sync();
    const messages = await dms[0].messages();
    expect(messages.length).toBe(3);

    const reactionMessage = messages[2];
    const messageContent = reactionMessage.content as Reaction;
    expect(messageContent.action).toBe("added");
    expect(messageContent.content).toBe("smile");
    expect(messageContent.reference).toBe(originalMessage);
    expect(messageContent.schema).toBe("shortcode");
  });

  it("has a proper shouldPush value", () => {
    const codec = new ReactionCodec();
    expect(codec.shouldPush()).toBe(false);
  });
});
