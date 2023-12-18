import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import {
  ContentTypeScreenEffect,
  EffectType,
  ScreenEffectCodec,
} from "./ScreenEffect";
import type { ScreenEffect } from "./ScreenEffect";

describe("ScreenEffectContentType", () => {
  it("has the right content type", () => {
    expect(ContentTypeScreenEffect.authorityId).toBe("xmtp.org");
    expect(ContentTypeScreenEffect.typeId).toBe("screenEffect");
    expect(ContentTypeScreenEffect.versionMajor).toBe(1);
    expect(ContentTypeScreenEffect.versionMinor).toBe(0);
  });

  it("can send a screen effect", async () => {
    const aliceWallet = Wallet.createRandom();
    const aliceClient = await Client.create(aliceWallet, {
      codecs: [new ScreenEffectCodec()],
      env: "local",
    });
    await aliceClient.publishUserContact();

    const bobWallet = Wallet.createRandom();
    const bobClient = await Client.create(bobWallet, {
      codecs: [new ScreenEffectCodec()],
      env: "local",
    });
    await bobClient.publishUserContact();

    const conversation = await aliceClient.conversations.newConversation(
      bobWallet.address,
    );

    const originalMessage = await conversation.send("test");

    const screenEffect: ScreenEffect = {
      messageId: "123",
      effectType: EffectType.SNOW,
    };

    await conversation.send(screenEffect, {
      contentType: ContentTypeScreenEffect,
    });

    const bobConversation = await bobClient.conversations.newConversation(
      aliceWallet.address,
    );
    const messages = await bobConversation.messages();

    expect(messages.length).toBe(2);

    const screenEffectMessage = messages[1];
    const messageContent = screenEffectMessage.content as ScreenEffect;
    expect(messageContent.messageId).toBe("123");
    expect(messageContent.effectType).toBe(EffectType.SNOW);
  });
});
