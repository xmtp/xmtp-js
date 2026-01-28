import {
  ConsentState,
  ContentType,
  contentTypeGroupUpdated,
  contentTypeLeaveRequest,
  ConversationType,
  DeliveryStatus,
  encodeText,
  GroupMessageKind,
  MetadataField,
  metadataFieldName,
  ReactionAction,
  ReactionSchema,
  SortDirection,
  type GroupUpdated,
  type MessageDisappearingSettings,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import type { DecodedMessage } from "@/DecodedMessage";
import {
  createRegisteredClient,
  createSigner,
  sleep,
  TestCodec,
} from "@test/helpers";

describe("Group", () => {
  it("should create a group", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.createGroup([client2.inboxId]);
    expect(group).toBeDefined();
    expect(
      (await client1.conversations.getConversationById(group.id))?.id,
    ).toBe(group.id);
    expect(group.id).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(group.isActive).toBe(true);
    expect(group.name).toBe("");
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(1);

    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(await group.metadata()).toEqual({
      conversationType: ConversationType.Group,
      creatorInboxId: client1.inboxId,
    });

    expect(client1.conversations.listDms().length).toBe(0);

    const groups = client1.conversations.listGroups();
    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe(group.id);

    // confirm group in other client
    await client2.conversations.sync();
    const groups2 = client2.conversations.listGroups();
    expect(groups2.length).toBe(1);
    expect(groups2[0].id).toBe(group.id);

    expect(client2.conversations.listDms().length).toBe(0);
  });

  it("should create a group with an identifier", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2, identifier: identifier2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroupWithIdentifiers([
      identifier2,
    ]);
    expect(group).toBeDefined();
    expect(
      (await client1.conversations.getConversationById(group.id))?.id,
    ).toBe(group.id);
    expect(group.id).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(group.isActive).toBe(true);
    expect(group.name).toBe("");
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(1);

    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(await group.metadata()).toEqual({
      conversationType: ConversationType.Group,
      creatorInboxId: client1.inboxId,
    });

    const groups = client1.conversations.listGroups();
    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe(group.id);
    expect(client1.conversations.listDms().length).toBe(0);

    // confirm group in other client
    await client2.conversations.sync();
    const groups2 = client2.conversations.listGroups();
    expect(groups2.length).toBe(1);
    expect(groups2[0].id).toBe(group.id);

    expect(client2.conversations.listDms().length).toBe(0);
  });

  it("should optimistically create a group", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = client1.conversations.createGroupOptimistic({
      groupName: "foo",
      groupDescription: "bar",
    });

    expect(group.id).toBeDefined();
    expect(group.name).toBe("foo");
    expect(group.description).toBe("bar");
    expect(group.imageUrl).toBe("");
    expect(group.addedByInboxId).toBe(client1.inboxId);

    const text = "gm";
    await group.sendText(text, true);

    const messages = await group.messages();
    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe(text);
    expect(messages[0].deliveryStatus).toBe(DeliveryStatus.Unpublished);

    await group.publishMessages();

    const messages2 = await group.messages();
    expect(messages2.length).toBe(1);
    expect(messages2[0].content).toBe(text);
    expect(messages2[0].deliveryStatus).toBe(DeliveryStatus.Published);
  });

  it("should optimistically create a group with members", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = client1.conversations.createGroupOptimistic({
      groupName: "foo",
      groupDescription: "bar",
    });

    expect(group.id).toBeDefined();
    expect(group.name).toBe("foo");
    expect(group.description).toBe("bar");
    expect(group.imageUrl).toBe("");
    expect(group.addedByInboxId).toBe(client1.inboxId);

    const text = "gm";
    await group.sendText(text, true);

    const messages = await group.messages();
    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe(text);
    expect(messages[0].deliveryStatus).toBe(DeliveryStatus.Unpublished);

    await group.addMembers([client2.inboxId]);

    const members = await group.members();
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds.length).toBe(2);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);

    const messages3 = await group.messages();
    expect(messages3.length).toBe(2);
    expect(messages3[0].content).toBe(text);
    expect(messages3[0].deliveryStatus).toBe(DeliveryStatus.Published);
    expect(messages3[1].deliveryStatus).toBe(DeliveryStatus.Published);
  });

  it("should create a group with options", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = await client1.conversations.createGroup([], {
      groupName: "foo",
      groupImageUrlSquare: "https://foo/bar.png",
      groupDescription: "foo",
    });
    expect(group.name).toBe("foo");
    expect(group.imageUrl).toBe("https://foo/bar.png");
    expect(group.description).toBe("foo");
  });

  it("should update group name", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = await client1.conversations.createGroup([]);
    expect(group.name).toBe("");
    const newName = "foo";
    await group.updateName(newName);
    expect(group.name).toBe(newName);
    const messages = await group.messages();
    expect(messages.length).toBe(1);
    const message = messages[0] as DecodedMessage<GroupUpdated>;
    expect(message.content!.metadataFieldChanges).toHaveLength(1);
    expect(message.content!.metadataFieldChanges[0].fieldName).toBe(
      metadataFieldName(MetadataField.GroupName),
    );
    expect(message.content!.metadataFieldChanges[0].oldValue).toBe("");
    expect(message.content!.metadataFieldChanges[0].newValue).toBe(newName);
  });

  it("should update group image URL", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = await client1.conversations.createGroup([]);
    expect(group.imageUrl).toBe("");
    const imageUrl = "https://foo/bar.jpg";
    await group.updateImageUrl(imageUrl);
    expect(group.imageUrl).toBe(imageUrl);
    const messages = await group.messages();
    expect(messages.length).toBe(1);
    const message = messages[0] as DecodedMessage<GroupUpdated>;
    expect(message.content!.metadataFieldChanges).toHaveLength(1);
    expect(message.content!.metadataFieldChanges[0].fieldName).toBe(
      metadataFieldName(MetadataField.GroupImageUrlSquare),
    );
    expect(message.content!.metadataFieldChanges[0].oldValue).toBe("");
    expect(message.content!.metadataFieldChanges[0].newValue).toBe(imageUrl);
  });

  it("should update group description", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = await client1.conversations.createGroup([]);
    expect(group.description).toBe("");
    const newDescription = "foo";
    await group.updateDescription(newDescription);
    expect(group.description).toBe(newDescription);
    const messages = await group.messages();
    expect(messages.length).toBe(1);
    const message = messages[0] as DecodedMessage<GroupUpdated>;
    expect(message.content!.metadataFieldChanges).toHaveLength(1);
    expect(message.content!.metadataFieldChanges[0].fieldName).toBe(
      metadataFieldName(MetadataField.Description),
    );
    expect(message.content!.metadataFieldChanges[0].oldValue).toBe("");
    expect(message.content!.metadataFieldChanges[0].newValue).toBe(
      newDescription,
    );
  });

  it("should update group app data", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = await client1.conversations.createGroup([]);
    expect(group.appData).toBe("");
    const appData = "foo";
    await group.updateAppData(appData);
    expect(group.appData).toBe(appData);
    const messages = await group.messages();
    expect(messages.length).toBe(1);
    const message = messages[0] as DecodedMessage<GroupUpdated>;
    expect(message.content!.metadataFieldChanges).toHaveLength(1);
    expect(message.content!.metadataFieldChanges[0].fieldName).toBe(
      metadataFieldName(MetadataField.AppData),
    );
    expect(message.content!.metadataFieldChanges[0].oldValue).toBe("");
    expect(message.content!.metadataFieldChanges[0].newValue).toBe(appData);
  });

  it("should send and list messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    expect(await group.lastMessage()).toBeDefined();

    const text = "gm";
    await group.sendText(text);

    const messages = await group.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    const lastMessage = await group.lastMessage();
    expect(lastMessage).toBeDefined();
    expect(lastMessage?.id).toBe(messages[1].id);
    expect(lastMessage?.content).toBe(text);

    await client2.conversations.sync();
    const groups = client2.conversations.listGroups();
    expect(groups.length).toBe(1);

    const group2 = groups[0];
    expect(group2).toBeDefined();
    await group2.sync();
    expect(group2.id).toBe(group.id);

    const messages2 = await group2.messages();
    expect(messages2.length).toBe(2);
    expect(messages2[1].content).toBe(text);

    const lastMessage2 = await group2.lastMessage();
    expect(lastMessage2).toBeDefined();
    expect(lastMessage2?.id).toBe(messages2[1].id);
    expect(lastMessage2?.content).toBe(text);
  });

  it("should optimistically send and list messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    const text = "gm";
    await group.sendText(text, true);

    const messages = await group.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const groups = client2.conversations.listGroups();
    expect(groups.length).toBe(1);

    const group2 = groups[0];
    expect(group2).toBeDefined();

    await group2.sync();
    expect(group2.id).toBe(group.id);

    const messages2 = await group2.messages();
    expect(messages2.length).toBe(1);

    await group.publishMessages();
    await group2.sync();

    const messages4 = await group2.messages();
    expect(messages4.length).toBe(2);
    expect(messages4[1].content).toBe(text);
  });

  it("should filter messages with options", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const testCodec = new TestCodec();
    const client1 = await createRegisteredClient(signer1, {
      codecs: [testCodec],
    });
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    // leave request message
    await client2.conversations.sync();
    const group2 = client2.conversations.listGroups()[0];
    await group2.requestRemoval();
    await group.sync();

    const textMessageId = await group.sendText("gm");
    await group.sendMarkdown("# gm");
    await group.sendAttachment({
      filename: "test.txt",
      mimeType: "text/plain",
      content: new Uint8Array([1, 2, 3]),
    });
    await group.sendReply({
      reference: textMessageId,
      referenceInboxId: client1.inboxId,
      content: encodeText("gm"),
    });
    const replyMessage = await group.lastMessage();
    await group.sendReaction({
      reference: textMessageId,
      action: ReactionAction.Added,
      content: "👍",
      schema: ReactionSchema.Unicode,
      referenceInboxId: client1.inboxId,
    });
    await group.sendActions({
      id: "actions-1",
      description: "test",
      actions: [
        {
          id: "opt-1",
          label: "Option 1",
        },
      ],
    });
    await group.sendIntent({
      id: "intent-1",
      actionId: "opt-1",
    });
    await group.sendTransactionReference({
      networkId: "1",
      reference: "1234567890",
    });
    await group.sendWalletSendCalls({
      version: "1.0",
      chainId: "1",
      from: "0x1234567890",
      calls: [
        {
          to: "0x1234567890",
          data: "0x1234567890",
          value: "0x1234567890",
        },
      ],
    });
    await group.sendReadReceipt();
    await group.sendRemoteAttachment({
      url: "https://foo/bar.png",
      contentDigest: "1234567890",
      secret: new Uint8Array([1, 2, 3]),
      salt: new Uint8Array([1, 2, 3]),
      nonce: new Uint8Array([1, 2, 3]),
      scheme: "https",
      contentLength: 100,
    });
    await group.sendMultiRemoteAttachment({
      attachments: [
        {
          url: "https://foo/bar.png",
          contentDigest: "1234567890",
          secret: new Uint8Array([1, 2, 3]),
          salt: new Uint8Array([1, 2, 3]),
          nonce: new Uint8Array([1, 2, 3]),
          scheme: "https",
          contentLength: 100,
        },
      ],
    });

    await group.send(testCodec.encode({ test: "test" }));

    const messages = await group.messages();
    // read receipts and reactions are automatically filtered
    expect(messages.length).toBe(13);

    // default sort order
    expect(messages[0].contentType).toEqual(contentTypeGroupUpdated());

    // descending sort order
    const sortedMessages1 = await group.messages({
      direction: SortDirection.Descending,
    });
    expect(sortedMessages1[0].contentType).toEqual(testCodec.contentType);

    const filteredMessages1 = await group.messages({
      contentTypes: [ContentType.Text, ContentType.Markdown, ContentType.Reply],
    });
    expect(filteredMessages1.length).toBe(3);

    const filteredMessages2 = await group.messages({
      contentTypes: [
        ContentType.Actions,
        ContentType.Intent,
        ContentType.TransactionReference,
        ContentType.WalletSendCalls,
      ],
    });
    expect(filteredMessages2.length).toBe(4);

    const filteredMessages3 = await group.messages({
      contentTypes: [
        ContentType.Attachment,
        ContentType.RemoteAttachment,
        ContentType.MultiRemoteAttachment,
      ],
    });
    expect(filteredMessages3.length).toBe(3);

    const filteredMessages4 = await group.messages({
      contentTypes: [
        ContentType.GroupUpdated,
        ContentType.LeaveRequest,
        ContentType.Custom,
      ],
    });
    expect(filteredMessages4.length).toBe(3);

    const filteredMessages5 = await group.messages({
      excludeSenderInboxIds: [client2.inboxId],
    });
    expect(filteredMessages5.length).toBe(12);

    const filteredMessages6 = await group.messages({
      excludeContentTypes: [
        ContentType.Text,
        ContentType.Markdown,
        ContentType.Reply,
      ],
    });
    expect(filteredMessages6.length).toBe(10);

    const filteredMessages7 = await group.messages({
      sentAfterNs: replyMessage?.sentAtNs,
    });
    // does not include reaction and read receipt messages
    expect(filteredMessages7.length).toBe(7);

    const filteredMessages8 = await group.messages({
      sentBeforeNs: replyMessage?.sentAtNs,
    });
    expect(filteredMessages8.length).toBe(5);

    // initial group updated message adding a member
    const filteredMessages9 = await group.messages({
      kind: GroupMessageKind.MembershipChange,
    });
    expect(filteredMessages9.length).toBe(1);

    await group.sendText("gm", true);
    const filteredMessages10 = await group.messages({
      deliveryStatus: DeliveryStatus.Published,
    });
    expect(filteredMessages10.length).toBe(13);
    const filteredMessages11 = await group.messages({
      deliveryStatus: DeliveryStatus.Unpublished,
    });
    expect(filteredMessages11.length).toBe(1);
  });

  it("should stream messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    await client2.conversations.sync();
    const groups = client2.conversations.listGroups();
    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe(group.id);

    const streamedMessages: unknown[] = [];
    const stream = await groups[0].stream({
      onValue: (message) => {
        streamedMessages.push(message.content);
      },
    });

    await group.sendText("gm");
    await group.sendText("gm2");

    setTimeout(() => {
      void stream.end();
    }, 100);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.content).toBe("gm");
      }
      if (count === 2) {
        expect(message.content).toBe("gm2");
      }
    }

    expect(streamedMessages).toEqual(["gm", "gm2"]);
  });

  it("should add and remove members", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    const members = await group.members();

    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await group.addMembers([client3.inboxId]);

    const members2 = await group.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await group.removeMembers([client2.inboxId]);

    const members3 = await group.members();
    expect(members3.length).toBe(2);

    const memberInboxIds3 = members3.map((member) => member.inboxId);
    expect(memberInboxIds3).toContain(client1.inboxId);
    expect(memberInboxIds3).not.toContain(client2.inboxId);
    expect(memberInboxIds3).toContain(client3.inboxId);

    const messages = (await group.messages()) as DecodedMessage<GroupUpdated>[];
    expect(messages.length).toBe(3);
    expect(messages[0].content?.addedInboxes).toHaveLength(1);
    expect(messages[0].content?.addedInboxes[0].inboxId).toBe(client2.inboxId);
    expect(messages[1].content?.addedInboxes).toHaveLength(1);
    expect(messages[1].content?.addedInboxes[0].inboxId).toBe(client3.inboxId);
    expect(messages[2].content?.removedInboxes).toHaveLength(1);
    expect(messages[2].content?.removedInboxes[0].inboxId).toBe(
      client2.inboxId,
    );
  });

  it("should add and remove admins", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    expect(group.isSuperAdmin(client1.inboxId)).toBe(true);
    expect(group.listSuperAdmins().length).toBe(1);
    expect(group.listSuperAdmins()).toContain(client1.inboxId);
    expect(group.isAdmin(client1.inboxId)).toBe(false);
    expect(group.isAdmin(client2.inboxId)).toBe(false);
    expect(group.listAdmins().length).toBe(0);

    await group.addAdmin(client2.inboxId);
    expect(group.isAdmin(client2.inboxId)).toBe(true);
    expect(group.listAdmins().length).toBe(1);
    expect(group.listAdmins()).toContain(client2.inboxId);

    await group.removeAdmin(client2.inboxId);
    expect(group.isAdmin(client2.inboxId)).toBe(false);
    expect(group.listAdmins().length).toBe(0);

    const messages = (await group.messages()) as DecodedMessage<GroupUpdated>[];
    expect(messages.length).toBe(3);
    expect(messages[1].content?.addedAdminInboxes).toHaveLength(1);
    expect(messages[1].content?.addedAdminInboxes[0].inboxId).toBe(
      client2.inboxId,
    );
    expect(messages[2].content?.removedAdminInboxes).toHaveLength(1);
    expect(messages[2].content?.removedAdminInboxes[0].inboxId).toBe(
      client2.inboxId,
    );
  });

  it("should add and remove super admins", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    expect(group.isSuperAdmin(client1.inboxId)).toBe(true);
    expect(group.isSuperAdmin(client2.inboxId)).toBe(false);
    expect(group.listSuperAdmins().length).toBe(1);
    expect(group.listSuperAdmins()).toContain(client1.inboxId);

    await group.addSuperAdmin(client2.inboxId);
    expect(group.isSuperAdmin(client2.inboxId)).toBe(true);
    expect(group.listSuperAdmins().length).toBe(2);
    expect(group.listSuperAdmins()).toContain(client1.inboxId);
    expect(group.listSuperAdmins()).toContain(client2.inboxId);

    await group.removeSuperAdmin(client2.inboxId);
    expect(group.isSuperAdmin(client2.inboxId)).toBe(false);
    expect(group.listSuperAdmins().length).toBe(1);
    expect(group.listSuperAdmins()).toContain(client1.inboxId);

    const messages = (await group.messages()) as DecodedMessage<GroupUpdated>[];
    expect(messages.length).toBe(3);
    expect(messages[1].content?.addedSuperAdminInboxes).toHaveLength(1);
    expect(messages[1].content?.addedSuperAdminInboxes[0].inboxId).toBe(
      client2.inboxId,
    );
    expect(messages[2].content?.removedSuperAdminInboxes).toHaveLength(1);
    expect(messages[2].content?.removedSuperAdminInboxes[0].inboxId).toBe(
      client2.inboxId,
    );
  });

  it("should manage consent state", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);
    expect(group).toBeDefined();
    expect(group.consentState()).toBe(ConsentState.Allowed);

    await client2.conversations.sync();
    const group2 = await client2.conversations.getConversationById(group.id);
    expect(group2).toBeDefined();
    expect(group2!.consentState()).toBe(ConsentState.Unknown);
    await group2!.sendText("gm!");
    expect(group2!.consentState()).toBe(ConsentState.Allowed);
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
    const group = await client1.conversations.createGroup([client2.inboxId], {
      messageDisappearingSettings,
    });

    // verify that the message disappearing settings are set and enabled
    expect(group.messageDisappearingSettings()).toEqual({
      fromNs: 1n,
      inNs: 2_000_000_000n,
    });
    expect(group.isMessageDisappearingEnabled()).toBe(true);

    // send messages to the group
    const messageId1 = await group.sendText("gm");
    const messageId2 = await group.sendText("gm2");

    // verify that the messages are sent
    expect((await group.messages()).length).toBe(3);

    // sync the messages to the other client
    await client2.conversations.sync();
    const group2 = client2.conversations.listGroups()[0];
    await group2.sync();

    // verify that the message disappearing settings are set and enabled
    expect(group2.messageDisappearingSettings()).toEqual({
      fromNs: 1n,
      inNs: 2_000_000_000n,
    });
    expect(group2.isMessageDisappearingEnabled()).toBe(true);

    // wait for the messages to be deleted
    await sleep(2000);

    // verify that the messages are deleted
    expect((await group.messages()).length).toBe(1);

    // verify that the messages are deleted on the other client
    expect((await group2.messages()).length).toBe(1);

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
    await group.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(group.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });

    expect(group.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await group2.sync();

    // verify that the message disappearing settings are set and disabled
    expect(group2.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });
    expect(group2.isMessageDisappearingEnabled()).toBe(false);

    // check for metadata field changes
    const messages = await group2.messages();
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
    await group2.sendText("gm");
    await group2.sendText("gm2");

    // verify that the messages are sent
    expect((await group2.messages()).length).toBe(5);

    // sync original group
    await group.sync();

    // verify that the messages are not deleted
    expect((await group.messages()).length).toBe(5);
  });

  it("should return paused for version", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createDm(client2.inboxId);
    expect(group.pausedForVersion()).toBeUndefined();
  });

  it("should get hmac keys", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.createGroup([client2.inboxId]);

    const hmacKeys = group.hmacKeys();
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
    const group = await client1.conversations.createGroup([client2.inboxId]);
    const debugInfo = await group.debugInfo();
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

  it("should count messages with various filters", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.createGroup([client2.inboxId]);

    await group.sendText("text 1");
    await sleep(10);
    const timestamp1 = BigInt(Date.now() * 1_000_000);
    await sleep(10);
    await group.sendText("text 2");
    await sleep(10);
    const timestamp2 = BigInt(Date.now() * 1_000_000);
    await sleep(10);
    await group.sendText("text 3");

    expect(await group.countMessages()).toBe(4);

    // Time filters
    expect(
      await group.countMessages({
        sentBeforeNs: timestamp1,
        contentTypes: [ContentType.Text],
      }),
    ).toBe(1);
    expect(
      await group.countMessages({
        sentAfterNs: timestamp1,
      }),
    ).toBe(2);
    expect(
      await group.countMessages({
        sentAfterNs: timestamp2,
        contentTypes: [ContentType.Text],
      }),
    ).toBe(1);
    expect(
      await group.countMessages({
        sentAfterNs: timestamp1,
        sentBeforeNs: timestamp2,
      }),
    ).toBe(1);

    // Content type filter
    expect(
      await group.countMessages({
        contentTypes: [ContentType.Text],
      }),
    ).toBe(3);
  });

  it("should have pending removal state after requesting removal from the group", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    await client1.conversations.createGroup([client2.inboxId]);

    await client2.conversations.sync();
    const group2 = client2.conversations.listGroups()[0];

    expect(group2.isPendingRemoval()).toBe(false);
    await group2.requestRemoval();
    expect(group2.isPendingRemoval()).toBe(true);
    expect(group2.isActive).toBe(true);

    const messages = await group2.messages();
    const leaveRequestMessage = messages[1];
    expect(leaveRequestMessage.contentType).toEqual(contentTypeLeaveRequest());
  });

  it("should remove a member after processing their removal request", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);

    await client2.conversations.sync();
    const group2 = client2.conversations.listGroups()[0];

    await group2.requestRemoval();

    // messages and welcomes must be synced
    await client2.conversations.syncAll();
    await client1.conversations.syncAll();

    // wait for worker to process the removal request
    await sleep(4000);

    await group2.sync();

    expect(group2.isActive).toBe(false);
    expect(group2.isPendingRemoval()).toBe(true);

    expect(await group.members()).toHaveLength(1);
    expect(await group2.members()).toHaveLength(1);
  });
});
