import {
  ConsentState,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  type MessageDisappearingSettings,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import {
  ContentTypeTest,
  createRegisteredClient,
  createSigner,
  createUser,
  sleep,
  TestCodec,
} from "@test/helpers";

describe.concurrent("Conversation", () => {
  it("should update conversation name", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);
    const newName = "foo";
    await conversation.updateName(newName);
    expect(conversation.name).toBe(newName);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.listGroups();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);
    expect(conversation2.name).toBe(newName);
    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(1);
  });

  it("should update conversation image URL", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);
    const imageUrl = "https://foo/bar.jpg";
    await conversation.updateImageUrl(imageUrl);
    expect(conversation.imageUrl).toBe(imageUrl);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.listGroups();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);
    expect(conversation2.imageUrl).toBe(imageUrl);
    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(1);
  });

  it("should update conversation description", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);
    const newDescription = "foo";
    await conversation.updateDescription(newDescription);
    expect(conversation.description).toBe(newDescription);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.listGroups();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);
    expect(conversation2.description).toBe(newDescription);
    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(1);
  });

  it("should add and remove members", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    const members = await conversation.members();

    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await conversation.addMembers([client3.inboxId]);

    const members2 = await conversation.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await conversation.removeMembers([client2.inboxId]);

    const members3 = await conversation.members();
    expect(members3.length).toBe(2);

    const memberInboxIds3 = members3.map((member) => member.inboxId);
    expect(memberInboxIds3).toContain(client1.inboxId);
    expect(memberInboxIds3).not.toContain(client2.inboxId);
    expect(memberInboxIds3).toContain(client3.inboxId);
  });

  it("should add and remove members by inbox id", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    const members = await conversation.members();
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await conversation.addMembers([client3.inboxId]);

    const members2 = await conversation.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await conversation.removeMembers([client2.inboxId]);

    const members3 = await conversation.members();
    expect(members3.length).toBe(2);

    const memberInboxIds3 = members3.map((member) => member.inboxId);
    expect(memberInboxIds3).toContain(client1.inboxId);
    expect(memberInboxIds3).not.toContain(client2.inboxId);
    expect(memberInboxIds3).toContain(client3.inboxId);
  });

  it("should send and list messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    const text = "gm";
    await conversation.send(text);

    const messages = await conversation.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const conversations = client2.conversations.listGroups();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);

    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(1);
    expect(messages2[0].content).toBe(text);
  });

  it("should require content type when sending non-string content", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1, {
      codecs: [new TestCodec()],
    });
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    await expect(() => conversation.send(1)).rejects.toThrow();
    await expect(() => conversation.send({ foo: "bar" })).rejects.toThrow();
    await expect(
      conversation.send({ foo: "bar" }, ContentTypeTest),
    ).resolves.not.toThrow();
  });

  it("should optimistically send and list messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    const text = "gm";
    conversation.sendOptimistic(text);

    const messages = await conversation.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const conversations = client2.conversations.listGroups();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();

    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);

    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(0);

    await conversation.publishMessages();
    await conversation2.sync();

    const messages4 = await conversation2.messages();
    expect(messages4.length).toBe(1);
    expect(messages4[0].content).toBe(text);
  });

  it("should require content type when optimistically sending non-string content", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1, {
      codecs: [new TestCodec()],
    });
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    expect(() => conversation.sendOptimistic(1)).toThrow();
    expect(() => conversation.sendOptimistic({ foo: "bar" })).toThrow();
    expect(() =>
      conversation.sendOptimistic({ foo: "bar" }, ContentTypeTest),
    ).not.toThrow();
  });

  it("should throw when sending content without a codec", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    await expect(
      conversation.send({ foo: "bar" }, ContentTypeTest),
    ).rejects.toThrow();
  });

  it("should stream messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    await client2.conversations.sync();
    const conversation2 = client2.conversations.listGroups();
    expect(conversation2.length).toBe(1);
    expect(conversation2[0].id).toBe(conversation.id);

    const streamedMessages: unknown[] = [];
    const stream = conversation2[0].stream((_, message) => {
      streamedMessages.push(message!.content);
    });

    await conversation.send("gm");
    await conversation.send("gm2");

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message!.content).toBe("gm");
      }
      if (count === 2) {
        expect(message!.content).toBe("gm2");
        break;
      }
    }

    expect(streamedMessages).toEqual(["gm", "gm2"]);
  });

  it("should add and remove admins", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    expect(conversation.isSuperAdmin(client1.inboxId)).toBe(true);
    expect(conversation.superAdmins.length).toBe(1);
    expect(conversation.superAdmins).toContain(client1.inboxId);
    expect(conversation.isAdmin(client1.inboxId)).toBe(false);
    expect(conversation.isAdmin(client2.inboxId)).toBe(false);
    expect(conversation.admins.length).toBe(0);

    await conversation.addAdmin(client2.inboxId);
    expect(conversation.isAdmin(client2.inboxId)).toBe(true);
    expect(conversation.admins.length).toBe(1);
    expect(conversation.admins).toContain(client2.inboxId);

    await conversation.removeAdmin(client2.inboxId);
    expect(conversation.isAdmin(client2.inboxId)).toBe(false);
    expect(conversation.admins.length).toBe(0);
  });

  it("should add and remove super admins", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    expect(conversation.isSuperAdmin(client1.inboxId)).toBe(true);
    expect(conversation.isSuperAdmin(client2.inboxId)).toBe(false);
    expect(conversation.superAdmins.length).toBe(1);
    expect(conversation.superAdmins).toContain(client1.inboxId);

    await conversation.addSuperAdmin(client2.inboxId);
    expect(conversation.isSuperAdmin(client2.inboxId)).toBe(true);
    expect(conversation.superAdmins.length).toBe(2);
    expect(conversation.superAdmins).toContain(client1.inboxId);
    expect(conversation.superAdmins).toContain(client2.inboxId);

    await conversation.removeSuperAdmin(client2.inboxId);
    expect(conversation.isSuperAdmin(client2.inboxId)).toBe(false);
    expect(conversation.superAdmins.length).toBe(1);
    expect(conversation.superAdmins).toContain(client1.inboxId);
  });

  it("should manage group consent state", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    expect(group).toBeDefined();
    const dmGroup = await client1.conversations.newDm(client3.inboxId);
    expect(dmGroup).toBeDefined();

    await client2.conversations.sync();
    const group2 = await client2.conversations.getConversationById(group.id);
    expect(group2).toBeDefined();
    expect(group2!.consentState).toBe(ConsentState.Unknown);
    await group2!.send("gm!");
    expect(group2!.consentState).toBe(ConsentState.Allowed);

    await client3.conversations.sync();
    const dmGroup2 = await client3.conversations.getConversationById(
      dmGroup.id,
    );
    expect(dmGroup2).toBeDefined();
    expect(dmGroup2?.consentState).toBe(ConsentState.Unknown);
    await dmGroup2?.send("gm!");
    expect(dmGroup2?.consentState).toBe(ConsentState.Allowed);
  });

  it("should update group permissions", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    expect(conversation.permissions.policySet).toEqual({
      addMemberPolicy: 0,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 0,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateMessageDisappearingPolicy: 2,
    });

    await conversation.updatePermission(
      PermissionUpdateType.AddMember,
      PermissionPolicy.Admin,
    );

    await conversation.updatePermission(
      PermissionUpdateType.RemoveMember,
      PermissionPolicy.SuperAdmin,
    );

    await conversation.updatePermission(
      PermissionUpdateType.AddAdmin,
      PermissionPolicy.Admin,
    );

    await conversation.updatePermission(
      PermissionUpdateType.RemoveAdmin,
      PermissionPolicy.Admin,
    );

    await conversation.updatePermission(
      PermissionUpdateType.UpdateMetadata,
      PermissionPolicy.Admin,
      MetadataField.GroupName,
    );

    await conversation.updatePermission(
      PermissionUpdateType.UpdateMetadata,
      PermissionPolicy.Admin,
      MetadataField.Description,
    );

    await conversation.updatePermission(
      PermissionUpdateType.UpdateMetadata,
      PermissionPolicy.Admin,
      MetadataField.ImageUrlSquare,
    );

    expect(conversation.permissions.policySet).toEqual({
      addMemberPolicy: 2,
      removeMemberPolicy: 3,
      addAdminPolicy: 2,
      removeAdminPolicy: 2,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateMessageDisappearingPolicy: 2,
    });
  });

  it("should handle disappearing messages in a group", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    // create message disappearing settings so that messages are deleted after 1 second
    const messageDisappearingSettings: MessageDisappearingSettings = {
      fromNs: 10_000_000,
      inNs: 10_000_000,
    };

    // create a group with message disappearing settings
    const conversation = await client1.conversations.newGroup(
      [client2.inboxId],
      {
        messageDisappearingSettings,
      },
    );

    // verify that the message disappearing settings are set and enabled
    expect(conversation.messageDisappearingSettings()).toEqual({
      fromNs: 10_000_000,
      inNs: 10_000_000,
    });
    expect(conversation.isMessageDisappearingEnabled()).toBe(true);

    // send messages to the group
    await conversation.send("gm");
    await conversation.send("gm2");

    // verify that the messages are sent
    expect((await conversation.messages()).length).toBe(3);

    // sync the messages to the other client
    await client2.conversations.sync();
    const conversation2 = await client2.conversations.getConversationById(
      conversation.id,
    );
    await conversation2?.sync();

    // verify that the message disappearing settings are set and enabled
    expect(conversation2!.messageDisappearingSettings()).toEqual({
      fromNs: 10_000_000,
      inNs: 10_000_000,
    });
    expect(conversation2?.isMessageDisappearingEnabled()).toBe(true);

    // wait for the messages to be deleted
    await sleep(10000);

    // verify that the messages are deleted
    expect((await conversation.messages()).length).toBe(1);

    // verify that the messages are deleted on the other client
    expect((await conversation2?.messages())?.length).toBe(0);

    // remove the message disappearing settings
    await conversation.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(conversation.messageDisappearingSettings()).toEqual({
      fromNs: 0,
      inNs: 0,
    });

    expect(conversation.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await conversation2?.sync();

    // verify that the message disappearing settings are set and disabled
    expect(conversation2?.messageDisappearingSettings()).toEqual({
      fromNs: 0,
      inNs: 0,
    });
    expect(conversation2?.isMessageDisappearingEnabled()).toBe(false);

    // send messages to the group
    await conversation2?.send("gm");
    await conversation2?.send("gm2");

    // verify that the messages are sent
    expect((await conversation2?.messages())?.length).toBe(4);

    // sync original group
    await conversation.sync();

    // verify that the messages are not deleted
    expect((await conversation.messages()).length).toBe(5);
  });

  it("should handle disappearing messages in a DM group", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    // create message disappearing settings so that messages are deleted after 1 second
    const messageDisappearingSettings: MessageDisappearingSettings = {
      fromNs: 10_000_000,
      inNs: 10_000_000,
    };

    // create a group with message disappearing settings
    const conversation = await client1.conversations.newDm(client2.inboxId, {
      messageDisappearingSettings,
    });

    // verify that the message disappearing settings are set and enabled
    expect(conversation.messageDisappearingSettings()).toEqual({
      fromNs: 10_000_000,
      inNs: 10_000_000,
    });
    expect(conversation.isMessageDisappearingEnabled()).toBe(true);

    // send messages to the group
    await conversation.send("gm");
    await conversation.send("gm2");

    // verify that the messages are sent
    expect((await conversation.messages()).length).toBe(3);

    // sync the messages to the other client
    await client2.conversations.sync();
    const conversation2 = await client2.conversations.getConversationById(
      conversation.id,
    );
    await conversation2?.sync();

    // verify that the message disappearing settings are set and enabled
    expect(conversation2!.messageDisappearingSettings()).toEqual({
      fromNs: 10_000_000,
      inNs: 10_000_000,
    });
    expect(conversation2?.isMessageDisappearingEnabled()).toBe(true);

    // wait for the messages to be deleted
    await sleep(10000);

    // verify that the messages are deleted
    expect((await conversation.messages()).length).toBe(1);

    // verify that the messages are deleted on the other client
    expect((await conversation2?.messages())?.length).toBe(0);

    // remove the message disappearing settings
    await conversation.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(conversation.messageDisappearingSettings()).toEqual({
      fromNs: 0,
      inNs: 0,
    });

    expect(conversation.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await conversation2?.sync();

    // verify that the message disappearing settings are set and disabled
    expect(conversation2?.messageDisappearingSettings()).toEqual({
      fromNs: 0,
      inNs: 0,
    });
    expect(conversation2?.isMessageDisappearingEnabled()).toBe(false);

    // send messages to the group
    await conversation2?.send("gm");
    await conversation2?.send("gm2");

    // verify that the messages are sent
    expect((await conversation2?.messages())?.length).toBe(4);

    // sync original group
    await conversation.sync();

    // verify that the messages are not deleted
    expect((await conversation.messages()).length).toBe(5);
  });

  it("should return paused for version", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const conversation = await client1.conversations.newDm(client2.inboxId);
    expect(conversation.pausedForVersion()).toBeUndefined();
  });

  it("should get hmac keys", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const conversation = await client1.conversations.newGroup([
      client2.inboxId,
    ]);

    const hmacKeys = conversation.getHmacKeys();
    expect(hmacKeys.length).toBe(3);
    for (const hmacKey of hmacKeys) {
      expect(hmacKey.key).toBeDefined();
      expect(hmacKey.epoch).toBeDefined();
    }
  });
});
