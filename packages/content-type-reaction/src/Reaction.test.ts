import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import { ContentTypeReaction, ReactionCodec } from "./Reaction";
import type { Reaction } from "./Reaction";

describe("ReactionContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeReaction.authorityId).toBe("xmtp.org");
    expect(ContentTypeReaction.typeId).toBe("reaction");
    expect(ContentTypeReaction.versionMajor).toBe(1);
    expect(ContentTypeReaction.versionMinor).toBe(0);
  });

  it("can send a reaction", async () => {
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, { env: "local" });
    aliceClient.registerCodec(new ReactionCodec());
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, { env: "local" });
    bobClient.registerCodec(new ReactionCodec());
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
});
