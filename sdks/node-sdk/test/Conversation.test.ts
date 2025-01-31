import {
  ConsentState,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import {
  ContentTypeTest,
  createRegisteredClient,
  createUser,
  TestCodec,
} from "@test/helpers";

describe.concurrent("Conversation", () => {
  it("should update conversation name", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);
    const newName = "foo";
    await conversation.updateName(newName);
    expect(conversation.name).toBe(newName);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.list();
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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);
    const imageUrl = "https://foo/bar.jpg";
    await conversation.updateImageUrl(imageUrl);
    expect(conversation.imageUrl).toBe(imageUrl);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.list();
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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);
    const newDescription = "foo";
    await conversation.updateDescription(newDescription);
    expect(conversation.description).toBe(newDescription);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.list();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);
    expect(conversation2.description).toBe(newDescription);
    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(1);
  });

  it("should update conversation pinned frame URL", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);
    const pinnedFrameUrl = "https://foo/bar";
    await conversation.updatePinnedFrameUrl(pinnedFrameUrl);
    expect(conversation.pinnedFrameUrl).toBe(pinnedFrameUrl);
    const messages = await conversation.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const conversations = client2.conversations.list();
    expect(conversations.length).toBe(1);

    const conversation2 = conversations[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.id).toBe(conversation.id);
    expect(conversation2.pinnedFrameUrl).toBe(pinnedFrameUrl);
    const messages2 = await conversation2.messages();
    expect(messages2.length).toBe(1);
  });

  it("should add and remove members", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    const members = await conversation.members();

    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await conversation.addMembers([user3.account.address]);

    const members2 = await conversation.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await conversation.removeMembers([user2.account.address]);

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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    const members = await conversation.members();
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await conversation.addMembersByInboxId([client3.inboxId]);

    const members2 = await conversation.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await conversation.removeMembersByInboxId([client2.inboxId]);

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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    const text = "gm";
    await conversation.send(text);

    const messages = await conversation.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const conversations = client2.conversations.list();
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
    const client1 = await createRegisteredClient(user1, {
      codecs: [new TestCodec()],
    });
    await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    const text = "gm";
    conversation.sendOptimistic(text);

    const messages = await conversation.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const conversations = client2.conversations.list();
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
    const client1 = await createRegisteredClient(user1, {
      codecs: [new TestCodec()],
    });
    await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
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
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    await expect(
      conversation.send({ foo: "bar" }, ContentTypeTest),
    ).rejects.toThrow();
  });

  it("should stream messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    await client2.conversations.sync();
    const conversation2 = client2.conversations.list();
    expect(conversation2.length).toBe(1);
    expect(conversation2[0].id).toBe(conversation.id);

    const streamedMessages: string[] = [];
    const stream = conversation2[0].stream((_, message) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
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
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const group = await client1.conversations.newGroup([user2.account.address]);
    expect(group).toBeDefined();
    const dmGroup = await client1.conversations.newDm(user3.account.address);
    expect(dmGroup).toBeDefined();

    await client2.conversations.sync();
    const group2 = client2.conversations.getConversationById(group.id);
    expect(group2).toBeDefined();
    expect(group2!.consentState).toBe(ConsentState.Unknown);
    await group2!.send("gm!");
    expect(group2!.consentState).toBe(ConsentState.Allowed);

    await client3.conversations.sync();
    const dmGroup2 = client3.conversations.getConversationById(dmGroup.id);
    expect(dmGroup2).toBeDefined();
    expect(dmGroup2!.consentState).toBe(ConsentState.Unknown);
    await dmGroup2!.send("gm!");
    expect(dmGroup2!.consentState).toBe(ConsentState.Allowed);
  });

  it("should update group permissions", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    expect(conversation.permissions.policySet).toEqual({
      addMemberPolicy: 0,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 0,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateGroupPinnedFrameUrlPolicy: 0,
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

    await conversation.updatePermission(
      PermissionUpdateType.UpdateMetadata,
      PermissionPolicy.Admin,
      MetadataField.PinnedFrameUrl,
    );

    expect(conversation.permissions.policySet).toEqual({
      addMemberPolicy: 2,
      removeMemberPolicy: 3,
      addAdminPolicy: 2,
      removeAdminPolicy: 2,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateGroupPinnedFrameUrlPolicy: 2,
      updateMessageDisappearingPolicy: 2,
    });
  });
});
