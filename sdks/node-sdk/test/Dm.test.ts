import {
  ConsentState,
  ContentType,
  ConversationType,
  MetadataField,
  metadataFieldName,
  type GroupUpdated,
  type MessageDisappearingSettings,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import type { DecodedMessage } from "@/DecodedMessage";
import { createRegisteredClient, createSigner, sleep } from "@test/helpers";

describe("Dm", () => {
  it("should create a dm", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const dm = await client1.conversations.createDm(client2.inboxId);
    expect(dm).toBeDefined();
    expect(dm.id).toBeDefined();
    expect(dm.createdAtNs).toBeDefined();
    expect(dm.createdAt).toBeDefined();
    expect(dm.isActive).toBe(true);
    expect(dm.addedByInboxId).toBe(client1.inboxId);
    expect(dm.peerInboxId).toBe(client2.inboxId);

    expect((await dm.messages()).length).toBe(1);

    const members = await dm.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);

    const metadata = await dm.metadata();
    expect(metadata.conversationType).toBe(ConversationType.Dm);
    expect(metadata.creatorInboxId).toBe(client1.inboxId);

    expect(dm.consentState()).toBe(ConsentState.Allowed);

    const dms = client1.conversations.listDms();
    expect(dms.length).toBe(1);
    expect(dms[0].id).toBe(dm.id);

    expect(client1.conversations.listDms().length).toBe(1);
    expect(client1.conversations.listGroups().length).toBe(0);

    // confirm DM in other client
    await client2.conversations.sync();
    const dms2 = client2.conversations.listDms();
    expect(dms2.length).toBe(1);
    expect(dms2[0].id).toBe(dm.id);
    expect(dms2[0].peerInboxId).toBe(client1.inboxId);

    expect(client2.conversations.listDms().length).toBe(1);
    expect(client2.conversations.listGroups().length).toBe(0);

    const dupeDms = await dm.duplicateDms();
    expect(dupeDms.length).toEqual(0);
  });

  it("should create a DM with identifier", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2, identifier: identifier2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDmWithIdentifier(identifier2);
    expect(dm.peerInboxId).toBe(client2.inboxId);
  });

  it("should send and list messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId);

    expect(await dm.lastMessage()).toBeDefined();

    const text = "gm";
    await dm.sendText(text);

    const messages = await dm.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    const lastMessage = await dm.lastMessage();
    expect(lastMessage).toBeDefined();
    expect(lastMessage?.id).toBe(messages[1].id);
    expect(lastMessage?.content).toBe(text);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();
    expect(dms.length).toBe(1);

    const dm2 = dms[0];
    expect(dm2).toBeDefined();
    await dm2.sync();
    expect(dm2.id).toBe(dm.id);

    const messages2 = await dm2.messages();
    expect(messages2.length).toBe(2);
    expect(messages2[1].content).toBe(text);

    const lastMessage2 = await dm2.lastMessage();
    expect(lastMessage2).toBeDefined();
    expect(lastMessage2?.id).toBe(messages2[1].id);
    expect(lastMessage2?.content).toBe(text);
  });

  it("should optimistically send and list messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId);

    const text = "gm";
    await dm.sendText(text, true);

    const messages = await dm.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const dms = client2.conversations.listDms();
    expect(dms.length).toBe(1);

    const dm2 = dms[0];
    expect(dm2).toBeDefined();

    await dm2.sync();
    expect(dm2.id).toBe(dm.id);

    const messages2 = await dm2.messages();
    expect(messages2.length).toBe(1);

    await dm.publishMessages();
    await dm2.sync();

    const messages4 = await dm2.messages();
    expect(messages4.length).toBe(2);
    expect(messages4[1].content).toBe(text);
  });

  it("should stream messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId);

    // wait a second to exclude GroupUpdated message
    await sleep(1000);

    const streamedMessages: unknown[] = [];
    const stream = await dm.stream({
      onValue: (message) => {
        streamedMessages.push(message.content);
      },
    });

    await dm.sendText("gm");
    await dm.sendText("gm2");

    setTimeout(() => {
      void stream.end();
    }, 100);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
    }
    expect(count).toBe(2);
    expect(streamedMessages).toEqual(["gm", "gm2"]);
  });

  it("should manage consent state", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId);
    expect(dm.consentState()).toBe(ConsentState.Allowed);

    await client2.conversations.sync();
    const dm2 = client2.conversations.listDms()[0];
    expect(dm2).toBeDefined();
    expect(dm2.consentState()).toBe(ConsentState.Unknown);
    await dm2.sendText("gm!");
    expect(dm2.consentState()).toBe(ConsentState.Allowed);
  });

  it("should handle disappearing messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const stream = await client1.conversations.streamDeletedMessages();

    // create message disappearing settings so that messages are deleted after 1 second
    const messageDisappearingSettings: MessageDisappearingSettings = {
      fromNs: 1n,
      inNs: 2_000_000_000n,
    };

    // create a group with message disappearing settings
    const dm = await client1.conversations.createDm(client2.inboxId, {
      messageDisappearingSettings,
    });

    // verify that the message disappearing settings are set and enabled
    expect(dm.messageDisappearingSettings()).toEqual({
      fromNs: 1n,
      inNs: 2_000_000_000n,
    });
    expect(dm.isMessageDisappearingEnabled()).toBe(true);

    // send messages to the group
    const messageId1 = await dm.sendText("gm");
    const messageId2 = await dm.sendText("gm2");

    // verify that the messages are sent
    expect((await dm.messages()).length).toBe(3);

    // sync the messages to the other client
    await client2.conversations.sync();
    const dm2 = client2.conversations.listDms()[0];
    expect(dm2).toBeDefined();
    await dm2.sync();

    // verify that the message disappearing settings are set and enabled
    expect(dm2.messageDisappearingSettings()).toEqual({
      fromNs: 1n,
      inNs: 2_000_000_000n,
    });
    expect(dm2.isMessageDisappearingEnabled()).toBe(true);

    // wait for the messages to be deleted
    await sleep(2000);

    // verify that the messages are deleted
    expect((await dm.messages()).length).toBe(1);

    // verify that the messages are deleted on the other client
    expect((await dm2.messages()).length).toBe(1);

    setTimeout(() => {
      void stream.end();
    }, 1000);

    let count = 0;
    const messageIds: string[] = [];
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      messageIds.push(message.id);
    }
    expect(count).toBe(2);
    expect(messageIds).toContain(messageId1);
    expect(messageIds).toContain(messageId2);

    // remove the message disappearing settings
    await dm.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(dm.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });

    expect(dm.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await dm2.sync();

    // verify that the message disappearing settings are set and disabled
    expect(dm2.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });
    expect(dm2.isMessageDisappearingEnabled()).toBe(false);

    // check for metadata field changes
    const messages = await dm2.messages();
    const fieldChange1 = messages[1] as DecodedMessage<GroupUpdated>;
    expect(fieldChange1.content?.metadataFieldChanges).toBeDefined();
    expect(fieldChange1.content?.metadataFieldChanges.length).toBe(1);
    expect(fieldChange1.content?.metadataFieldChanges[0].fieldName).toBe(
      metadataFieldName(MetadataField.MessageExpirationFromNs),
    );
    expect(fieldChange1.content?.metadataFieldChanges[0].oldValue).toBe("1");
    expect(fieldChange1.content?.metadataFieldChanges[0].newValue).toBe("0");

    const fieldChange2 = messages[2] as DecodedMessage<GroupUpdated>;
    expect(fieldChange2.content?.metadataFieldChanges).toBeDefined();
    expect(fieldChange2.content?.metadataFieldChanges.length).toBe(1);
    expect(fieldChange2.content?.metadataFieldChanges[0].fieldName).toBe(
      metadataFieldName(MetadataField.MessageExpirationInNs),
    );
    expect(fieldChange2.content?.metadataFieldChanges[0].oldValue).toBe(
      "2000000000",
    );
    expect(fieldChange2.content?.metadataFieldChanges[0].newValue).toBe("0");

    // send messages to the group
    await dm2.sendText("gm");
    await dm2.sendText("gm2");

    // verify that the messages are sent
    expect((await dm2.messages()).length).toBe(5);

    // sync original group
    await dm.sync();

    // verify that the messages are not deleted
    expect((await dm.messages()).length).toBe(5);
  });

  it("should return paused for version", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.createDm(client2.inboxId);
    expect(conversation.pausedForVersion()).toBeUndefined();
  });

  it("should get hmac keys", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const dm = await client1.conversations.createDm(client2.inboxId);

    const hmacKeys = dm.hmacKeys();
    const groupIds = Object.keys(hmacKeys);
    for (const groupId of groupIds) {
      expect(hmacKeys[groupId].length).toBe(3);
      expect(hmacKeys[groupId][0].key).toBeDefined();
      expect(hmacKeys[groupId][0].epoch).toBeDefined();
      expect(hmacKeys[groupId][1].key).toBeDefined();
      expect(hmacKeys[groupId][1].epoch).toBeDefined();
      expect(hmacKeys[groupId][2].key).toBeDefined();
      expect(hmacKeys[groupId][2].epoch).toBeDefined();
    }
  });

  it("should get debug info", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId);
    const debugInfo = await dm.debugInfo();
    expect(debugInfo).toBeDefined();
    expect(debugInfo.epoch).toBeDefined();
    expect(debugInfo.maybeForked).toBe(false);
    expect(debugInfo.forkDetails).toBe("");
    expect(debugInfo.isCommitLogForked).toBeUndefined();
    expect(debugInfo.localCommitLog).toBeDefined();
    expect(debugInfo.remoteCommitLog).toBeDefined();
    expect(debugInfo.cursor).toBeDefined();
    expect(debugInfo.cursor.length).toBeGreaterThan(0);
    for (const cursor of debugInfo.cursor) {
      expect(cursor.originatorId).toBeDefined();
      expect(cursor.sequenceId).toBeDefined();
    }
  });

  it("should filter messages by content type", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm = await client1.conversations.createDm(client2.inboxId);

    await dm.sendText("gm");

    const messages = await dm.messages();
    expect(messages.length).toBe(2);

    const filteredMessages = await dm.messages({
      contentTypes: [ContentType.Text],
    });
    expect(filteredMessages.length).toBe(1);
  });

  it("should count messages with various filters", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    // Setup: create conversation and messages once
    const dm = await client1.conversations.createDm(client2.inboxId);

    await dm.sendText("text 1");
    await sleep(10);
    const timestamp1 = BigInt(Date.now() * 1_000_000);
    await sleep(10);
    await dm.sendText("text 2");
    await sleep(10);
    const timestamp2 = BigInt(Date.now() * 1_000_000);
    await sleep(10);
    await dm.sendText("text 3");

    // GroupUpdated messages are not counted
    expect(await dm.countMessages()).toBe(3);

    // Time filters
    expect(
      await dm.countMessages({
        sentBeforeNs: timestamp1,
        contentTypes: [ContentType.Text],
      }),
    ).toBe(1);
    expect(
      await dm.countMessages({
        sentAfterNs: timestamp1,
      }),
    ).toBe(2);
    expect(
      await dm.countMessages({
        sentAfterNs: timestamp2,
        contentTypes: [ContentType.Text],
      }),
    ).toBe(1);
    expect(
      await dm.countMessages({
        sentAfterNs: timestamp1,
        sentBeforeNs: timestamp2,
      }),
    ).toBe(1);

    // Content type filter
    expect(
      await dm.countMessages({
        contentTypes: [ContentType.Text],
      }),
    ).toBe(3);
  });
});
