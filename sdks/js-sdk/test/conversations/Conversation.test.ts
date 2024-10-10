import { ContentTypeId } from "@xmtp/content-type-primitives";
import { ContentTypeText } from "@xmtp/content-type-text";
import { content as proto } from "@xmtp/proto";
import { assert, vi } from "vitest";
import { SortDirection } from "@/ApiClient";
import type Client from "@/Client";
import { Compression } from "@/Client";
import { ConversationV2 } from "@/conversations/Conversation";
import { PrivateKey } from "@/crypto/PrivateKey";
import { SignedPublicKeyBundle } from "@/crypto/PublicKeyBundle";
import { DecodedMessage, MessageV1, type MessageV2 } from "@/Message";
import { sleep } from "@/utils/async";
import { buildDirectMessageTopic } from "@/utils/topic";
import { ContentTypeTestKey, TestKeyCodec } from "@test/ContentTypeTestKey";
import { newLocalHostClient, waitForUserContact } from "@test/helpers";

describe("conversation", () => {
  let alice: Client<string>;
  let bob: Client<string>;

  describe("v1", () => {
    beforeEach(async () => {
      alice = await newLocalHostClient({ publishLegacyContact: true });
      bob = await newLocalHostClient({ publishLegacyContact: true });
      await waitForUserContact(alice, alice);
      await waitForUserContact(bob, bob);
    });

    it("lists all messages", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );
      expect(aliceConversation.conversationVersion).toBe("v1");

      const bobConversation = await bob.conversations.newConversation(
        alice.address,
      );
      expect(bobConversation.conversationVersion).toBe("v1");

      const startingMessages = await aliceConversation.messages();
      expect(startingMessages).toHaveLength(0);
      await sleep(100);

      await bobConversation.send("Hi Alice");
      await aliceConversation.send("Hi Bob");
      await sleep(100);

      const [aliceMessages, bobMessages] = await Promise.all([
        aliceConversation.messages(),
        bobConversation.messages(),
      ]);

      expect(aliceMessages).toHaveLength(2);
      expect(aliceMessages[0].messageVersion).toBe("v1");
      expect(aliceMessages[0].error).toBeUndefined();
      expect(aliceMessages[0].senderAddress).toBe(bob.address);
      expect(aliceMessages[0].conversation.topic).toBe(aliceConversation.topic);

      expect(bobMessages).toHaveLength(2);
    });

    it("lists paginated messages", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );

      for (let i = 0; i < 10; i++) {
        await aliceConversation.send("gm");
      }
      await sleep(100);

      let numPages = 0;
      const messageIds = new Set<string>();
      for await (const page of aliceConversation.messagesPaginated({
        pageSize: 5,
      })) {
        numPages++;
        expect(page).toHaveLength(5);
        for (const msg of page) {
          expect(msg.content).toBe("gm");
          messageIds.add(msg.id);
        }
      }
      expect(numPages).toBe(2);
      expect(messageIds.size).toBe(10);

      // Test sorting
      let lastMessage: DecodedMessage<any> | undefined;
      for await (const page of aliceConversation.messagesPaginated({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
      })) {
        for (const msg of page) {
          if (lastMessage && lastMessage.sent) {
            expect(msg.sent?.valueOf()).toBeLessThanOrEqual(
              lastMessage.sent?.valueOf(),
            );
          }
          expect(msg).toBeInstanceOf(DecodedMessage);
          lastMessage = msg;
        }
      }
    });

    it("ignores failed decoding of messages", async () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );

      // This should be readable
      await aliceConversation.send("gm");
      // This should not be readable
      await alice.publishEnvelopes([
        {
          message: Uint8Array.from([1, 2, 3]),
          contentTopic: buildDirectMessageTopic(alice.address, bob.address),
        },
      ]);
      await sleep(100);

      let numMessages = 0;
      for await (const page of aliceConversation.messagesPaginated()) {
        numMessages += page.length;
      }
      expect(numMessages).toBe(1);
      expect(consoleWarn).toBeCalledTimes(1);
      consoleWarn.mockRestore();
    });

    it("does not allow self messaging", async () => {
      expect(
        alice.conversations.newConversation(alice.address),
      ).rejects.toThrow("self messaging not supported");
      expect(
        alice.conversations.newConversation(alice.address.toLowerCase()),
      ).rejects.toThrow("self messaging not supported");
    });

    it("can send a prepared message v1", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );

      const preparedMessage = await aliceConversation.prepareMessage("1");
      const messageID = await preparedMessage.messageID();

      const sentMessage = await preparedMessage.send();

      const messages = await aliceConversation.messages();
      const message = messages[0];
      expect(message.id).toBe(messageID);
      expect(sentMessage.id).toBe(messageID);
      expect(sentMessage.messageVersion).toBe("v1");
    });

    it("can send a prepared message v2", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
        {
          conversationId: "example.com",
          metadata: {},
        },
      );

      const preparedMessage = await aliceConversation.prepareMessage("sup");
      const messageID = await preparedMessage.messageID();

      const sentMessage = await preparedMessage.send();

      const messages = await aliceConversation.messages();
      const message = messages[0];
      expect(message.id).toBe(messageID);
      expect(message.content).toBe("sup");
      expect(sentMessage.id).toBe(messageID);
      expect(sentMessage.messageVersion).toBe("v2");
    });

    it("can send and stream ephemeral topic v1", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );

      // Start the stream before sending the message to ensure delivery
      const stream = await aliceConversation.streamEphemeral();

      if (!stream) {
        assert.fail("no stream");
      }

      await sleep(100);

      await aliceConversation.send("hello", { ephemeral: true });
      await sleep(100);

      const result = await stream.next();
      const message = result.value;

      expect(message.error).toBeUndefined();
      expect(message.messageVersion).toBe("v1");
      expect(message.content).toBe("hello");
      expect(message.senderAddress).toBe(alice.address);

      await sleep(100);

      // The message should not be persisted
      expect(await aliceConversation.messages()).toHaveLength(0);
      await stream.return();
    });

    it("can send and stream ephemeral topic v2", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
        {
          conversationId: "example.com",
          metadata: {},
        },
      );

      // Start the stream before sending the message to ensure delivery
      const stream = await aliceConversation.streamEphemeral();

      if (!stream) {
        assert.fail("no stream");
      }

      await sleep(100);

      await aliceConversation.send("hello", { ephemeral: true });
      await sleep(100);

      const result = await stream.next();
      const message = result.value;

      expect(message.error).toBeUndefined();
      expect(message.messageVersion).toBe("v2");
      expect(message.content).toBe("hello");
      expect(message.senderAddress).toBe(alice.address);

      await sleep(100);

      // The message should not be persisted
      expect(await aliceConversation.messages()).toHaveLength(0);
      await stream.return();
    });

    it("allows for sorted listing", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );
      await aliceConversation.send("1");
      await aliceConversation.send("2");
      await sleep(100);

      const sortedAscending = await aliceConversation.messages();
      expect(sortedAscending.length).toBe(2);
      expect(sortedAscending[0].content).toBe("1");

      const sortedDescending = await aliceConversation.messages({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
      });
      expect(sortedDescending[0].content).toBe("2");
    });

    it("streams messages", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
      );
      const bobConversation = await bob.conversations.newConversation(
        alice.address,
      );

      // Start the stream before sending the message to ensure delivery
      const stream = await aliceConversation.streamMessages();
      await sleep(100);
      await bobConversation.send("gm");

      let numMessages = 0;
      for await (const message of stream) {
        numMessages++;
        expect(message.contentTopic).toBe(
          buildDirectMessageTopic(alice.address, bob.address),
        );
        expect(message.conversation.topic).toBe(aliceConversation.topic);
        expect(message.error).toBeUndefined();
        expect(message.messageVersion).toBe("v1");
        if (numMessages === 1) {
          expect(message.content).toBe("gm");
          expect(message.senderAddress).toBe(bob.address);
          expect(message.recipientAddress).toBe(alice.address);
        } else {
          expect(message.content).toBe("gm to you too");
          expect(message.senderAddress).toBe(alice.address);
        }
        if (numMessages === 5) {
          break;
        }
        await aliceConversation.send("gm to you too");
      }

      const result = await stream.next();
      expect(result.done).toBeTruthy();

      await sleep(100);
      expect(numMessages).toBe(5);
      expect(await aliceConversation.messages()).toHaveLength(5);
      await stream.return();
    });

    it("handles limiting page size", async () => {
      const bobConvo = await alice.conversations.newConversation(bob.address);
      for (let i = 0; i < 5; i++) {
        await bobConvo.send("hi");
      }
      const messages = await bobConvo.messages({ limit: 2 });
      expect(messages).toHaveLength(2);
    });

    it("queries with date filters", async () => {
      const now = new Date().valueOf();
      const dates = [1, 2, 3, 4, 5].map(
        (daysAgo) => new Date(now - daysAgo * 1000 * 60 * 60 * 24),
      );
      const convo = await alice.conversations.newConversation(bob.address);
      for (const date of dates) {
        await convo.send("gm: " + date.valueOf(), { timestamp: date });
      }
      await sleep(100);

      const fourDaysAgoOrMore = await convo.messages({ endTime: dates[3] });
      expect(fourDaysAgoOrMore).toHaveLength(2);

      const twoDaysAgoOrLess = await convo.messages({ startTime: dates[1] });
      expect(twoDaysAgoOrLess).toHaveLength(2);

      const twoToFourDaysAgo = await convo.messages({
        endTime: dates[1],
        startTime: dates[3],
      });
      expect(twoToFourDaysAgo).toHaveLength(3);
    });

    it("can send compressed v1 messages", async () => {
      const convo = await alice.conversations.newConversation(bob.address);
      const content = "A".repeat(111);
      await convo.send(content, {
        contentType: ContentTypeText,
        compression: Compression.COMPRESSION_DEFLATE,
      });

      await sleep(100);

      // Verify that messages are actually compressed
      const envelopes = await alice.apiClient.query(
        {
          contentTopic: convo.topic,
        },
        { limit: 1 },
      );
      const messageBytes = envelopes[0].message as Uint8Array;
      const decoded = await MessageV1.fromBytes(messageBytes);
      const decrypted = await decoded.decrypt(
        alice.keystore,
        alice.publicKeyBundle,
      );
      const encodedContent = proto.EncodedContent.decode(decrypted);
      expect(encodedContent.content).not.toStrictEqual(
        new Uint8Array(111).fill(65),
      );
      expect(encodedContent.compression).toBe(Compression.COMPRESSION_DEFLATE);

      const results = await convo.messages();
      expect(results).toHaveLength(1);
      const msg = results[0];
      expect(msg.content).toBe(content);
    });

    it("does not compress v1 messages less than 10 bytes", async () => {
      const convo = await alice.conversations.newConversation(bob.address);
      await convo.send("gm!", {
        contentType: ContentTypeText,
        compression: Compression.COMPRESSION_DEFLATE,
      });

      const envelopes = await alice.apiClient.query(
        {
          contentTopic: convo.topic,
        },
        { limit: 1 },
      );
      const messageBytes = envelopes[0].message as Uint8Array;
      const decoded = await MessageV1.fromBytes(messageBytes);
      const decrypted = await decoded.decrypt(
        alice.keystore,
        alice.publicKeyBundle,
      );
      const encodedContent = proto.EncodedContent.decode(decrypted);
      expect(encodedContent.compression).toBeUndefined();
    });

    it("throws when opening a conversation with an unknown address", () => {
      expect(alice.conversations.newConversation("0xfoo")).rejects.toThrow();
      const validButUnknown = "0x1111111111222222222233333333334444444444";
      expect(
        alice.conversations.newConversation(validButUnknown),
      ).rejects.toThrow(
        `Recipient ${validButUnknown} is not on the XMTP network`,
      );
    });

    it("normalizes lowercase addresses", async () => {
      const bobLower = bob.address.toLowerCase();
      await expect(
        alice.conversations.newConversation(bobLower),
      ).resolves.toMatchObject({
        peerAddress: bob.address,
      });
    });

    it("filters out spoofed messages", async () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const aliceConvo = await alice.conversations.newConversation(bob.address);
      const bobConvo = await bob.conversations.newConversation(alice.address);
      const stream = await bobConvo.streamMessages();
      await sleep(100);
      // mallory takes over alice's client
      const mallory = await newLocalHostClient();
      const aliceKeystore = alice.keystore;
      alice.keystore = mallory.keystore;
      await aliceConvo.send("Hello from Mallory");
      // alice restores control
      alice.keystore = aliceKeystore;
      await aliceConvo.send("Hello from Alice");
      const result = await stream.next();
      const msg = result.value;
      expect(msg.senderAddress).toBe(alice.address);
      expect(msg.content).toBe("Hello from Alice");
      await stream.return();
      expect(consoleWarn).toBeCalledTimes(1);
      consoleWarn.mockRestore();
    });

    it("can send custom content type", async () => {
      const aliceConvo = await alice.conversations.newConversation(bob.address);
      const bobConvo = await bob.conversations.newConversation(alice.address);
      const aliceStream = await aliceConvo.streamMessages();
      const bobStream = await bobConvo.streamMessages();
      const key = PrivateKey.generate().publicKey;

      // alice doesn't recognize the type
      await expect(
        // @ts-expect-error default client doesn't have the right type
        aliceConvo.send(key, {
          contentType: ContentTypeTestKey,
        }),
      ).rejects.toThrow("unknown content type xmtp.test/public-key:1.0");

      // bob doesn't recognize the type
      alice.registerCodec(new TestKeyCodec());
      // @ts-expect-error default client doesn't have the right type
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
      });

      const aliceResult1 = await aliceStream.next();
      const aliceMessage1 = aliceResult1.value;
      expect(aliceMessage1.content).toEqual(key);

      const bobResult1 = await bobStream.next();
      const bobMessage1 = bobResult1.value;
      expect(bobMessage1).toBeTruthy();
      expect(bobMessage1.error?.message).toBe(
        "unknown content type xmtp.test/public-key:1.0",
      );
      expect(bobMessage1.contentType).toBeTruthy();
      expect(bobMessage1.contentType.sameAs(ContentTypeTestKey));
      expect(bobMessage1.content).toBeUndefined();
      expect(bobMessage1.contentFallback).toBe("publickey bundle");

      // both recognize the type
      bob.registerCodec(new TestKeyCodec());
      // @ts-expect-error default client doesn't have the right type
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
      });
      const bobResult2 = await bobStream.next();
      const bobMessage2 = bobResult2.value;
      expect(bobMessage2.contentType).toBeTruthy();
      expect(bobMessage2.contentType.sameAs(ContentTypeTestKey)).toBeTruthy();
      expect(key.equals(bobMessage2.content)).toBeTruthy();

      // alice tries to send version that is not supported
      const type2 = new ContentTypeId({
        ...ContentTypeTestKey,
        versionMajor: 2,
      });
      // @ts-expect-error default client doesn't have the right type
      expect(aliceConvo.send(key, { contentType: type2 })).rejects.toThrow(
        "unknown content type xmtp.test/public-key:2.0",
      );

      await bobStream.return();
      await aliceStream.return();
    });
  });

  describe("v2", () => {
    beforeEach(async () => {
      alice = await newLocalHostClient();
      bob = await newLocalHostClient();
      await waitForUserContact(alice, alice);
      await waitForUserContact(bob, bob);
    });

    it("v2 conversation", async () => {
      expect(await bob.getUserContact(alice.address)).toBeInstanceOf(
        SignedPublicKeyBundle,
      );
      expect(await alice.getUserContact(bob.address)).toBeInstanceOf(
        SignedPublicKeyBundle,
      );

      const ac = await alice.conversations.newConversation(bob.address);
      expect(ac.conversationVersion).toBe("v2");
      if (!(ac instanceof ConversationV2)) {
        assert.fail();
      }
      const as = await ac.streamMessages();
      await sleep(100);

      const bcs = await bob.conversations.list();
      expect(bcs).toHaveLength(1);
      const bc = bcs[0];
      expect(bc.conversationVersion).toBe("v2");
      if (!(bc instanceof ConversationV2)) {
        assert.fail();
      }
      expect(bc.topic).toBe(ac.topic);
      const bs = await bc.streamMessages();
      await sleep(100);

      await ac.send("gm");
      expect((await bs.next()).value.content).toBe("gm");
      expect((await as.next()).value.content).toBe("gm");
      await bc.send("gm to you too");
      expect((await bs.next()).value.content).toBe("gm to you too");
      expect((await as.next()).value.content).toBe("gm to you too");

      await bs.return();
      await as.return();

      const messages = await alice.listEnvelopes<MessageV2>(
        ac.topic,
        ac.processEnvelope.bind(ac),
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].shouldPush).toBe(true);
      expect(messages[0].senderHmac).toBeDefined();
      expect(messages[1].shouldPush).toBe(true);
      expect(messages[1].senderHmac).toBeDefined();
    });

    // it('rejects spoofed contact bundles', async () => {
    //   // Generated via exporting 1) conversationV2Export and 2) pre-crafted envelope with swapped contact bundles
    //   const topic =
    //     '/xmtp/0/m-Gdb7oj5nNdfZ3MJFLAcS4WTABgr6al1hePy6JV1-QUE/proto'
    //   const envelopeMessage = Buffer.from(
    //     'Er0ECkcIwNruhKLgkKUXEjsveG10cC8wL20tR2RiN29qNW5OZGZaM01KRkxBY1M0V1RBQmdyNmFsMWhlUHk2SlYxLVFVRS9wcm90bxLxAwruAwognstLoG6LWgiBRsWuBOt+tYNJz+CqCj9zq6hYymLoak8SDFsVSy+cVAII0/r3sxq7A/GCOrVtKH6J+4ggfUuI5lDkFPJ8G5DHlysCfRyFMcQDIG/2SFUqSILAlpTNbeTC9eSI2hUjcnlpH9+ncFcBu8StGfmilVGfiADru2fGdThiQ+VYturqLIJQXCHO2DkvbbUOg9xI66E4Hj41R9vE8yRGeZ/eRGRLRm06HftwSQgzAYf2AukbvjNx/k+xCMqti49Qtv9AjzxVnwttLiA/9O+GDcOsiB1RQzbZZzaDjQ/nLDTF6K4vKI4rS9QwzTJqnoCdp0SbMZFf+KVZpq3VWnMGkMxLW5Fr6gMvKny1e1LAtUJSIclI/1xPXu5nsKd4IyzGb2ZQFXFQ/BVL9Z4CeOZTsjZLGTOGS75xzzGHDtKohcl79+0lgIhAuSWSLDa2+o2OYT0fAjChp+qqxXcisAyrD5FB6c9spXKfoDZsqMV/bnCg3+udIuNtk7zBk7jdTDMkofEtE3hyIm8d3ycmxKYOakDPqeo+Nk1hQ0ogxI8Z7cEoS2ovi9+rGBMwREzltUkTVR3BKvgV2EOADxxTWo7y8WRwWxQ+O6mYPACsiFNqjX5Nvah5lRjihphQldJfyVOG8Rgf4UwkFxmI'
    //   )
    //   const convoExport = {
    //     version: 'v2' as const,
    //     topic: '/xmtp/0/m-Gdb7oj5nNdfZ3MJFLAcS4WTABgr6al1hePy6JV1-QUE/proto',
    //     keyMaterial: 'R0BBM5OPftNEuavH/991IKyJ1UqsgdEG4SrdxlIG2ZY=',
    //     peerAddress: '0x2f25e33D7146602Ec08D43c1D6B1b65fc151A677',
    //     createdAt: '2023-03-07T22:18:07.553Z',
    //     context: { conversationId: 'xmtp.org/foo', metadata: {} },
    //   }

    //   // Create a ConversationV2 from export (client here shouldn't matter)
    //   const convo = ConversationV2.fromExport(alice, convoExport)

    //   // Feed in a message directly into "decodeMessage" and assert that it throws
    //   // and look for "pre key not signed" in the error message
    //   expect(
    //     convo.decodeMessage({
    //       contentTopic: topic,
    //       message: envelopeMessage,
    //     })
    //   ).rejects.toThrow('pre key not signed by identity key')
    // })

    it("does not compress v2 messages less than 10 bytes", async () => {
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId: "example.com/nocompression",
        metadata: {},
      });
      await convo.send("gm!", {
        contentType: ContentTypeText,
        compression: Compression.COMPRESSION_DEFLATE,
      });

      const envelopes = await alice.apiClient.query(
        {
          contentTopic: convo.topic,
        },
        { limit: 1 },
      );
      const msg = await convo.decodeMessage(envelopes[0]);
      const decoded = proto.EncodedContent.decode(msg.contentBytes);
      expect(decoded.compression).toBeUndefined();
    });

    it("can send compressed v2 messages of various lengths", async () => {
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId: "example.com/compressedv2",
        metadata: {},
      });
      const content = "A".repeat(111);
      await convo.send(content, {
        contentType: ContentTypeText,
        compression: Compression.COMPRESSION_DEFLATE,
      });
      await convo.send("gm!", {
        contentType: ContentTypeText,
        compression: Compression.COMPRESSION_DEFLATE,
      });
      const results = await convo.messages();
      expect(results).toHaveLength(2);
      expect(results[0].content).toBe(content);
      expect(results[1].content).toBe("gm!");
    });

    it("can send compressed v2 prepared messages of various lengths", async () => {
      const aliceConversation = await alice.conversations.newConversation(
        bob.address,
        {
          conversationId: "example.com",
          metadata: {},
        },
      );

      const preparedMessage = await aliceConversation.prepareMessage("gm!", {
        compression: Compression.COMPRESSION_DEFLATE,
      });
      const messageID = await preparedMessage.messageID();
      const sentMessage = await preparedMessage.send();
      const preparedMessage2 = await aliceConversation.prepareMessage(
        "A".repeat(100),
        {
          compression: Compression.COMPRESSION_DEFLATE,
        },
      );
      const messageID2 = await preparedMessage2.messageID();
      const sentMessage2 = await preparedMessage2.send();

      const messages = await aliceConversation.messages();
      expect(messages[0].id).toBe(messageID);
      expect(messages[0].content).toBe("gm!");
      expect(sentMessage.id).toBe(messageID);
      expect(sentMessage.messageVersion).toBe("v2");
      expect(messages[1].id).toBe(messageID2);
      expect(messages[1].content).toBe("A".repeat(100));
      expect(sentMessage2.id).toBe(messageID2);
      expect(sentMessage2.messageVersion).toBe("v2");
    });

    it("handles limiting page size", async () => {
      const bobConvo = await alice.conversations.newConversation(bob.address, {
        conversationId: "xmtp.org/foo",
        metadata: {},
      });

      for (let i = 0; i < 5; i++) {
        await bobConvo.send("hi");
      }
      await sleep(100);
      const messages = await bobConvo.messages({ limit: 2 });
      expect(messages).toHaveLength(2);
    });

    it("conversation filtering", async () => {
      const conversationId = "xmtp.org/foo";
      const title = "foo";
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId,
        metadata: {
          title,
        },
      });

      const stream = await convo.streamMessages();
      await sleep(100);
      const sentMessage = await convo.send("foo");
      if (!(sentMessage instanceof DecodedMessage)) {
        throw new Error("Not a DecodedMessage");
      }
      expect(sentMessage.conversation.context?.conversationId).toBe(
        conversationId,
      );
      await sleep(100);

      const firstMessageFromStream = (await stream.next()).value;
      expect(firstMessageFromStream.messageVersion).toBe("v2");
      expect(firstMessageFromStream.content).toBe("foo");
      expect(firstMessageFromStream.conversation.context?.conversationId).toBe(
        conversationId,
      );

      const messages = await convo.messages();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("foo");
      expect(messages[0].conversation).toBe(convo);
      await stream.return();
    });

    it("queries with date filters", async () => {
      const now = new Date().valueOf();
      const dates = [1, 2, 3, 4, 5].map(
        (daysAgo) => new Date(now - daysAgo * 1000 * 60 * 60 * 24),
      );
      const convo = await alice.conversations.newConversation(bob.address, {
        conversationId: "xmtp.org/foo",
        metadata: {},
      });
      for (const date of dates) {
        await convo.send("gm: " + date.valueOf(), { timestamp: date });
      }
      await sleep(100);

      const fourDaysAgoOrMore = await convo.messages({ endTime: dates[3] });
      expect(fourDaysAgoOrMore).toHaveLength(2);

      const twoDaysAgoOrLess = await convo.messages({ startTime: dates[1] });
      expect(twoDaysAgoOrLess).toHaveLength(2);

      const twoToFourDaysAgo = await convo.messages({
        endTime: dates[1],
        startTime: dates[3],
      });
      expect(twoToFourDaysAgo).toHaveLength(3);
    });

    it("can send custom content type", async () => {
      const aliceConvo = await alice.conversations.newConversation(
        bob.address,
        {
          conversationId: "xmtp.org/key",
          metadata: {},
        },
      );
      if (!(aliceConvo instanceof ConversationV2)) {
        assert.fail();
      }
      await sleep(100);
      const bobConvo = await bob.conversations.newConversation(alice.address, {
        conversationId: "xmtp.org/key",
        metadata: {},
      });
      const aliceStream = await aliceConvo.streamMessages();
      const bobStream = await bobConvo.streamMessages();
      const key = PrivateKey.generate().publicKey;

      // alice doesn't recognize the type
      expect(
        aliceConvo.send(key, {
          contentType: ContentTypeTestKey,
        }),
      ).rejects.toThrow("unknown content type xmtp.test/public-key:1.0");

      // bob doesn't recognize the type
      alice.registerCodec(new TestKeyCodec());
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
      });

      const aliceResult1 = await aliceStream.next();
      const aliceMessage1 = aliceResult1.value;
      expect(aliceMessage1.content).toEqual(key);

      const bobResult1 = await bobStream.next();
      const bobMessage1 = bobResult1.value;
      expect(bobMessage1).toBeTruthy();
      expect(bobMessage1.error?.message).toBe(
        "unknown content type xmtp.test/public-key:1.0",
      );
      expect(bobMessage1.contentType).toBeTruthy();
      expect(bobMessage1.contentType.sameAs(ContentTypeTestKey));
      expect(bobMessage1.content).toBeUndefined();
      expect(bobMessage1.contentFallback).toBe("publickey bundle");

      // both recognize the type
      bob.registerCodec(new TestKeyCodec());
      await aliceConvo.send(key, {
        contentType: ContentTypeTestKey,
      });
      const bobResult2 = await bobStream.next();
      const bobMessage2 = bobResult2.value;
      expect(bobMessage2.contentType).toBeTruthy();
      expect(bobMessage2.contentType.sameAs(ContentTypeTestKey)).toBeTruthy();
      expect(key.equals(bobMessage2.content)).toBeTruthy();

      // alice tries to send version that is not supported
      const type2 = new ContentTypeId({
        ...ContentTypeTestKey,
        versionMajor: 2,
      });
      expect(aliceConvo.send(key, { contentType: type2 })).rejects.toThrow(
        "unknown content type xmtp.test/public-key:2.0",
      );

      await bobStream.return();
      await aliceStream.return();

      const messages = await alice.listEnvelopes<MessageV2>(
        aliceConvo.topic,
        aliceConvo.processEnvelope.bind(aliceConvo),
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].shouldPush).toBe(false);
      expect(messages[0].senderHmac).toBeDefined();
      expect(messages[1].shouldPush).toBe(false);
      expect(messages[1].senderHmac).toBeDefined();
    });
  });
});
