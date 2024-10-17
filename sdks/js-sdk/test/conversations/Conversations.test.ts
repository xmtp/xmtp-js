import type Client from "@/Client";
import { ConversationV1, ConversationV2 } from "@/conversations/Conversation";
import { sleep } from "@/utils/async";
import { buildDirectMessageTopic, buildUserIntroTopic } from "@/utils/topic";
import { newLocalHostClient } from "@test/helpers";

describe("conversations", () => {
  describe("listConversations", () => {
    let alice: Client;
    let bob: Client;

    beforeEach(async () => {
      alice = await newLocalHostClient({ publishLegacyContact: true });
      bob = await newLocalHostClient({ publishLegacyContact: true });
    });

    afterEach(async () => {
      if (alice) await alice.close();
      if (bob) await bob.close();
    });

    it("lists all conversations", async () => {
      const aliceConversations = await alice.conversations.list();
      expect(aliceConversations).toHaveLength(0);

      const aliceToBob = await alice.conversations.newConversation(bob.address);
      await aliceToBob.send("gm");

      const aliceConversationsAfterMessage = await alice.conversations.list();
      expect(aliceConversationsAfterMessage).toHaveLength(1);
      expect(aliceConversationsAfterMessage[0].peerAddress).toBe(bob.address);

      const bobConversations = await bob.conversations.list();
      expect(bobConversations).toHaveLength(1);
      expect(bobConversations[0].peerAddress).toBe(alice.address);
    });

    it("lists conversations from cache", async () => {
      const aliceConversations = await alice.conversations.list();
      expect(aliceConversations).toHaveLength(0);

      const aliceConversationsFromCache =
        await alice.conversations.listFromCache();
      expect(aliceConversationsFromCache).toHaveLength(0);

      const bobConversationsFromCache = await bob.conversations.listFromCache();
      expect(bobConversationsFromCache).toHaveLength(0);

      const aliceToBob = await alice.conversations.newConversation(bob.address);
      await aliceToBob.send("gm");
      await sleep(100);

      expect(await alice.conversations.listFromCache()).toHaveLength(0);
      expect(await bob.conversations.listFromCache()).toHaveLength(0);

      const aliceConversationsAfterMessage = await alice.conversations.list();
      expect(aliceConversationsAfterMessage).toHaveLength(1);
      expect(aliceConversationsAfterMessage[0].peerAddress).toBe(bob.address);

      const aliceConversationsFromCacheAfterMessage =
        await alice.conversations.listFromCache();
      expect(aliceConversationsFromCacheAfterMessage).toHaveLength(1);
      expect(aliceConversationsFromCacheAfterMessage[0].peerAddress).toBe(
        bob.address,
      );

      const bobConversations = await bob.conversations.list();
      expect(bobConversations).toHaveLength(1);
      expect(bobConversations[0].peerAddress).toBe(alice.address);

      const bobConversationsFromCacheAfterMessage =
        await bob.conversations.listFromCache();
      expect(bobConversationsFromCacheAfterMessage).toHaveLength(1);
      expect(bobConversationsFromCacheAfterMessage[0].peerAddress).toBe(
        alice.address,
      );
    });

    it("resumes list with cache after new conversation is created", async () => {
      const aliceConversations1 = await alice.conversations.list();
      expect(aliceConversations1).toHaveLength(0);

      await alice.conversations.newConversation(bob.address, {
        conversationId: "foo",
        metadata: {},
      });
      const aliceConversations2 = await alice.conversations.list();
      expect(aliceConversations2).toHaveLength(1);

      await alice.conversations.newConversation(bob.address, {
        conversationId: "bar",
        metadata: {},
      });
      const fromKeystore = (await alice.keystore.getV2Conversations())
        .conversations;
      expect(fromKeystore[1].context?.conversationId).toBe("bar");

      const aliceConversations3 = await alice.conversations.list();
      expect(aliceConversations3).toHaveLength(2);
    });
  });

  it("dedupes conversations when multiple messages are in the introduction topic", async () => {
    const alice = await newLocalHostClient({ publishLegacyContact: true });
    const bob = await newLocalHostClient({ publishLegacyContact: true });
    const aliceConversation = await alice.conversations.newConversation(
      bob.address,
    );
    const bobConversation = await bob.conversations.newConversation(
      alice.address,
    );
    await Promise.all([
      aliceConversation.send("gm"),
      bobConversation.send("gm"),
    ]);

    const [aliceConversationsList, bobConversationList] = await Promise.all([
      alice.conversations.list(),
      bob.conversations.list(),
    ]);
    expect(aliceConversationsList).toHaveLength(1);
    expect(bobConversationList).toHaveLength(1);
    await alice.close();
    await bob.close();
  });

  describe("newConversation", () => {
    let alice: Client;
    let bob: Client;

    beforeEach(async () => {
      alice = await newLocalHostClient({ publishLegacyContact: true });
      bob = await newLocalHostClient({ publishLegacyContact: true });
    });

    afterEach(async () => {
      if (alice) await alice.close();
      if (bob) await bob.close();
    });

    it("uses an existing v1 conversation when one exists", async () => {
      const aliceConvo = await alice.conversations.newConversation(bob.address);
      expect(aliceConvo instanceof ConversationV1).toBeTruthy();
      await aliceConvo.send("gm");
      const bobConvo = await bob.conversations.newConversation(alice.address);
      expect(bobConvo instanceof ConversationV1).toBeTruthy();
    });

    it("does not create a duplicate conversation with an address case mismatch", async () => {
      const convo1 = await alice.conversations.newConversation(bob.address);
      await convo1.send("gm");
      const convos = await alice.conversations.list();
      expect(convos).toHaveLength(1);
      const convo2 = await alice.conversations.newConversation(
        bob.address.toLowerCase(),
      );
      await convo2.send("gm");
      const convos2 = await alice.conversations.list();
      expect(convos2).toHaveLength(1);
    });

    it("continues to use v1 conversation even after upgrading bundle", async () => {
      const aliceConvo = await alice.conversations.newConversation(bob.address);
      await aliceConvo.send("gm");
      expect(aliceConvo instanceof ConversationV1).toBeTruthy();
      await bob.publishUserContact(false);
      alice.forgetContact(bob.address);

      const aliceConvo2 = await alice.conversations.newConversation(
        bob.address,
      );
      expect(aliceConvo2 instanceof ConversationV1).toBeTruthy();
      await aliceConvo2.send("hi");

      const bobConvo = await bob.conversations.newConversation(alice.address);
      expect(bobConvo instanceof ConversationV1).toBeTruthy();
      const messages = await bobConvo.messages();
      expect(messages.length).toBe(2);
      expect(messages[0].content).toBe("gm");
      expect(messages[1].content).toBe("hi");
    });

    it("creates a new V2 conversation when no existing convo and V2 bundle", async () => {
      await bob.publishUserContact(false);
      alice.forgetContact(bob.address);

      const aliceConvo = await alice.conversations.newConversation(bob.address);
      expect(aliceConvo instanceof ConversationV2).toBeTruthy();
    });

    it("creates a v2 conversation when conversation ID is present", async () => {
      const conversationId = "xmtp.org/foo";
      const aliceConvo = await alice.conversations.newConversation(
        bob.address,
        { conversationId, metadata: { foo: "bar" } },
      );
      await sleep(100);

      expect(aliceConvo instanceof ConversationV2).toBeTruthy();
      expect(aliceConvo.context?.conversationId).toBe(conversationId);
      expect(aliceConvo.context?.metadata.foo).toBe("bar");

      // Ensure alice received an invite
      const aliceConvos = await alice.conversations.updateV2Conversations();
      expect(aliceConvos).toHaveLength(1);
      expect(aliceConvos[0].topic).toBe(aliceConvo.topic);

      // Ensure bob received an invite
      const bobConvos = await bob.conversations.updateV2Conversations();
      expect(bobConvos).toHaveLength(1);
      expect(bobConvos[0].topic).toBe(aliceConvo.topic);
    });

    it("re-uses same invite when multiple conversations started with the same ID", async () => {
      const conversationId = "xmtp.org/foo";
      const aliceConvo1 = await alice.conversations.newConversation(
        bob.address,
        { conversationId, metadata: {} },
      );
      await sleep(100);

      const aliceConvo2 = await alice.conversations.newConversation(
        bob.address,
        { conversationId, metadata: {} },
      );

      if (
        aliceConvo1 instanceof ConversationV2 &&
        aliceConvo2 instanceof ConversationV2
      ) {
        expect(aliceConvo2.topic).toBe(aliceConvo1.topic);
      } else {
        throw new Error("Not a v2 conversation");
      }

      const aliceConvos = await alice.conversations.updateV2Conversations();
      expect(aliceConvos).toHaveLength(1);
      expect(aliceConvos[0].topic).toBe(aliceConvo1.topic);
    });

    it("sends multiple invites when different IDs are used", async () => {
      const conversationId1 = "xmtp.org/foo";
      const conversationId2 = "xmtp.org/bar";
      const aliceConvo1 = await alice.conversations.newConversation(
        bob.address,
        { conversationId: conversationId1, metadata: {} },
      );

      const aliceConvo2 = await alice.conversations.newConversation(
        bob.address,
        { conversationId: conversationId2, metadata: {} },
      );

      if (
        !(aliceConvo1 instanceof ConversationV2) ||
        !(aliceConvo2 instanceof ConversationV2)
      ) {
        throw new Error("Not a V2 conversation");
      }

      expect(aliceConvo1.topic === aliceConvo2.topic).toBeFalsy();
      const aliceInvites = await alice.listInvitations();
      expect(aliceInvites).toHaveLength(2);

      const bobInvites = await bob.listInvitations();
      expect(bobInvites).toHaveLength(2);
    });

    it("handles races", async () => {
      const ctx = {
        conversationId: "xmtp.org/foo",
        metadata: {},
      };
      // Create three conversations in parallel
      await Promise.all([
        alice.conversations.newConversation(bob.address, ctx),
        alice.conversations.newConversation(bob.address, ctx),
        alice.conversations.newConversation(bob.address, ctx),
      ]);
      await sleep(50);

      const invites = await alice.listInvitations();
      expect(invites).toHaveLength(1);
    });
  });
});

describe.sequential("Conversation streams", () => {
  it("streams conversations", async () => {
    const alice = await newLocalHostClient({ publishLegacyContact: true });
    const bob = await newLocalHostClient({ publishLegacyContact: true });
    const stream = await alice.conversations.stream();
    const conversation = await alice.conversations.newConversation(bob.address);
    await conversation.send("hi bob");

    let numConversations = 0;
    for await (const conversation of stream) {
      numConversations++;
      expect(conversation.peerAddress).toBe(bob.address);
      break;
    }
    expect(numConversations).toBe(1);
    await stream.return();
    await alice.close();
    await bob.close();
  });

  it("streams all conversation messages from empty state", async () => {
    const alice = await newLocalHostClient({ publishLegacyContact: true });
    const bob = await newLocalHostClient({ publishLegacyContact: true });
    const charlie = await newLocalHostClient({ publishLegacyContact: true });
    const aliceCharlie = await alice.conversations.newConversation(
      charlie.address,
    );
    const bobAlice = await bob.conversations.newConversation(alice.address);

    const stream = alice.conversations.streamAllMessages();
    const messages = [];
    setTimeout(async () => {
      await aliceCharlie.send("gm alice -charlie");
      await bobAlice.send("gm alice -bob");
      await aliceCharlie.send("gm charlie -alice");
    }, 100);

    let numMessages = 0;
    for await (const message of await stream) {
      numMessages++;
      messages.push(message);
      if (numMessages === 3) {
        break;
      }
    }

    expect(messages[0].contentTopic).toBe(buildUserIntroTopic(alice.address));
    expect(messages[0].content).toBe("gm alice -charlie");
    expect(messages[1].contentTopic).toBe(buildUserIntroTopic(alice.address));
    expect(messages[1].content).toBe("gm alice -bob");
    expect(messages[2].contentTopic).toBe(
      buildDirectMessageTopic(alice.address, charlie.address),
    );
    expect(messages[2].content).toBe("gm charlie -alice");
    expect(numMessages).toBe(3);
    await (await stream).return(undefined);
    await alice.close();
    await bob.close();
    await charlie.close();
  });

  it("streams all conversation messages with a mix of v1 and v2 conversations", async () => {
    const alice = await newLocalHostClient({ publishLegacyContact: true });
    const bob = await newLocalHostClient({ publishLegacyContact: true });
    const aliceBobV1 = await alice.conversations.newConversation(bob.address);
    const aliceBobV2 = await alice.conversations.newConversation(bob.address, {
      conversationId: "xmtp.org/foo",
      metadata: {},
    });

    const stream = await alice.conversations.streamAllMessages();
    await sleep(50);

    await aliceBobV1.send("V1");
    const message1 = await stream.next();
    expect(message1.value.content).toBe("V1");
    expect(message1.value.contentTopic).toBe(
      buildUserIntroTopic(alice.address),
    );

    await aliceBobV2.send("V2");
    const message2 = await stream.next();
    expect(message2.value.content).toBe("V2");
    expect(message2.value.contentTopic).toBe(aliceBobV2.topic);

    await aliceBobV1.send("Second message in V1 channel");
    const message3 = await stream.next();
    expect(message3.value.content).toBe("Second message in V1 channel");
    expect(message3.value.contentTopic).toBe(
      buildDirectMessageTopic(alice.address, bob.address),
    );

    const aliceBobV2Bar = await alice.conversations.newConversation(
      bob.address,
      {
        conversationId: "xmtp.org/bar",
        metadata: {},
      },
    );
    await aliceBobV2Bar.send("bar");
    const message4 = await stream.next();
    expect(message4.value.content).toBe("bar");
    await stream.return(undefined);
    await alice.close();
    await bob.close();
  });

  it("handles a mix of streaming and listing conversations", async () => {
    const alice = await newLocalHostClient({ publishLegacyContact: true });
    const bob = await newLocalHostClient({ publishLegacyContact: true });
    await bob.conversations.newConversation(alice.address, {
      conversationId: "xmtp.org/1",
      metadata: {},
    });
    const aliceStream = await alice.conversations.stream();
    await sleep(50);
    await bob.conversations.newConversation(alice.address, {
      conversationId: "xmtp.org/2",
      metadata: {},
    });
    // Ensure the result has been received
    await aliceStream.next();
    // Expect that even though a new conversation was found while streaming the first conversation is still returned
    expect(await alice.conversations.list()).toHaveLength(2);
    await aliceStream.return();

    // Do it again to make sure the cache is updated with an existing timestamp
    await bob.conversations.newConversation(alice.address, {
      conversationId: "xmtp.org/3",
      metadata: {},
    });
    const aliceStream2 = await alice.conversations.stream();
    await sleep(50);
    await bob.conversations.newConversation(alice.address, {
      conversationId: "xmtp.org/4",
      metadata: {},
    });
    await aliceStream2.next();

    expect(await alice.conversations.list()).toHaveLength(4);
    await aliceStream2.return();
    await alice.close();
    await bob.close();
  });
});
