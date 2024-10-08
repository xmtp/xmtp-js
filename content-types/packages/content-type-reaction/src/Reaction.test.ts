import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { ContentTypeReaction, ReactionCodec, type Reaction } from "./Reaction";

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
    const canonicalEncoded = {
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
    const legacyEncoded = {
      type: ContentTypeReaction,
      parameters: {
        action: "added",
        reference: "abc123",
        schema: "shortcode",
      },
      content: new TextEncoder().encode("smile"),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const canonical = codec.decode(canonicalEncoded as any);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const legacy = codec.decode(legacyEncoded as any);
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
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, {
      codecs: [new ReactionCodec()],
      env: "local",
    });
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, {
      codecs: [new ReactionCodec()],
      env: "local",
    });
    await bobClient.publishUserContact();

    const conversation = await aliceClient.conversations.newConversation(
      bobWallet.address,
    );

    const originalMessage = await conversation.send("test");

    const reaction: Reaction = {
      action: "added",
      content: "smile",
      reference: originalMessage.id,
      schema: "shortcode",
    };

    await conversation.send(reaction, { contentType: ContentTypeReaction });

    const bobConversation = await bobClient.conversations.newConversation(
      aliceWallet.address,
    );
    const messages = await bobConversation.messages();

    expect(messages.length).toBe(2);

    const reactionMessage = messages[1];
    const messageContent = reactionMessage.content as Reaction;
    expect(messageContent.action).toBe("added");
    expect(messageContent.content).toBe("smile");
    expect(messageContent.reference).toBe(originalMessage.id);
    expect(messageContent.schema).toBe("shortcode");
  });

  it("has a proper shouldPush value based on content", () => {
    const codec = new ReactionCodec();

    const addReaction: Reaction = {
      action: "added",
      content: "smile",
      reference: "foo",
      schema: "shortcode",
    };

    const removeReaction: Reaction = {
      action: "removed",
      content: "smile",
      reference: "foo",
      schema: "shortcode",
    };

    expect(codec.shouldPush(addReaction)).toBe(true);
    expect(codec.shouldPush(removeReaction)).toBe(false);
  });
});
