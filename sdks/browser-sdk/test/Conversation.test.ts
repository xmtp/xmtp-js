import {
  ConsentState,
  GroupPermissionsOptions,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
} from "@xmtp/wasm-bindings";
import { describe, expect, it } from "vitest";
import type { SafeMessageDisappearingSettings } from "@/utils/conversions";
import {
  ContentTypeTest,
  createRegisteredClient,
  createUser,
  sleep,
  TestCodec,
} from "@test/helpers";

describe("Conversation", () => {
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
    const conversations = await client2.conversations.listGroups();
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
    const conversations = await client2.conversations.listGroups();
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
    const conversations = await client2.conversations.listGroups();
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

    await conversation.addMembersByInboxId([client3.inboxId!]);

    const members2 = await conversation.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await conversation.removeMembersByInboxId([client2.inboxId!]);

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
    const conversations = await client2.conversations.list();
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
    await conversation.sendOptimistic(text);

    const messages = await conversation.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const conversations = await client2.conversations.list();
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

    await expect(() => conversation.sendOptimistic(1)).rejects.toThrow();
    await expect(() =>
      conversation.sendOptimistic({ foo: "bar" }),
    ).rejects.toThrow();
    await expect(
      conversation.sendOptimistic({ foo: "bar" }, ContentTypeTest),
    ).resolves.not.toThrow();
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

  it("should add and remove admins", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    expect(await conversation.isSuperAdmin(client1.inboxId!)).toBe(true);
    await conversation.listSuperAdmins();
    expect(conversation.superAdmins.length).toBe(1);
    expect(conversation.superAdmins).toContain(client1.inboxId);
    expect(await conversation.isAdmin(client1.inboxId!)).toBe(false);
    expect(await conversation.isAdmin(client2.inboxId!)).toBe(false);
    await conversation.listAdmins();
    expect(conversation.admins.length).toBe(0);

    await conversation.addAdmin(client2.inboxId!);
    expect(await conversation.isAdmin(client2.inboxId!)).toBe(true);
    await conversation.listAdmins();
    expect(conversation.admins.length).toBe(1);
    expect(conversation.admins).toContain(client2.inboxId);

    await conversation.removeAdmin(client2.inboxId!);
    expect(await conversation.isAdmin(client2.inboxId!)).toBe(false);
    await conversation.listAdmins();
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

    expect(await conversation.isSuperAdmin(client1.inboxId!)).toBe(true);
    expect(await conversation.isSuperAdmin(client2.inboxId!)).toBe(false);

    await conversation.listSuperAdmins();
    expect(conversation.superAdmins.length).toBe(1);
    expect(conversation.superAdmins).toContain(client1.inboxId);

    await conversation.addSuperAdmin(client2.inboxId!);
    expect(await conversation.isSuperAdmin(client2.inboxId!)).toBe(true);

    await conversation.listSuperAdmins();
    expect(conversation.superAdmins.length).toBe(2);
    expect(conversation.superAdmins).toContain(client1.inboxId);
    expect(conversation.superAdmins).toContain(client2.inboxId);

    await conversation.removeSuperAdmin(client2.inboxId!);
    expect(await conversation.isSuperAdmin(client2.inboxId!)).toBe(false);

    await conversation.listSuperAdmins();
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
    const group2 = await client2.conversations.getConversationById(group.id);
    expect(group2).toBeDefined();

    expect(await group2!.consentState()).toBe(ConsentState.Unknown);
    await group2!.send("gm!");
    expect(await group2!.consentState()).toBe(ConsentState.Allowed);

    await client3.conversations.sync();
    const dmGroup2 = await client3.conversations.getConversationById(
      dmGroup.id,
    );
    expect(dmGroup2).toBeDefined();

    expect(await dmGroup2!.consentState()).toBe(ConsentState.Unknown);
    await dmGroup2!.send("gm!");
    expect(await dmGroup2!.consentState()).toBe(ConsentState.Allowed);
  });

  it("should update group permission policy", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    await createRegisteredClient(user3);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);

    const permissions = await conversation.permissions();
    expect(permissions.policySet).toEqual({
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

    const permissions2 = await conversation.permissions();
    expect(permissions2.policySet).toEqual({
      addMemberPolicy: 2,
      removeMemberPolicy: 3,
      addAdminPolicy: 2,
      removeAdminPolicy: 2,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateMessageDisappearingPolicy: 2,
    });

    const conversation2 = await client1.conversations.newGroup([], {
      permissions: GroupPermissionsOptions.AdminOnly,
    });

    const permissions3 = await conversation2.permissions();
    expect(permissions3.policySet).toEqual({
      addMemberPolicy: 2,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateMessageDisappearingPolicy: 2,
    });

    // required when group has no members
    await conversation2.sync();

    await conversation2.updatePermission(
      PermissionUpdateType.AddMember,
      PermissionPolicy.Allow,
    );

    const permissions4 = await conversation2.permissions();
    expect(permissions4.policySet).toEqual({
      addMemberPolicy: 0,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateMessageDisappearingPolicy: 2,
    });
  });

  it("should handle disappearing messages in a group", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);

    // create message disappearing settings so that messages are deleted after 1 second
    const messageDisappearingSettings: SafeMessageDisappearingSettings = {
      fromNs: 5_000_000n,
      inNs: 5_000_000n,
    };

    // create a group with message disappearing settings
    const conversation = await client1.conversations.newGroup(
      [user2.account.address],
      {
        messageDisappearingSettings,
      },
    );

    // verify that the message disappearing settings are set and enabled
    expect(await conversation.messageDisappearingSettings()).toEqual({
      fromNs: 5_000_000n,
      inNs: 5_000_000n,
    });
    expect(await conversation.isMessageDisappearingEnabled()).toBe(true);

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
    await conversation2!.sync();

    // verify that the message disappearing settings are set and enabled
    expect(await conversation2!.messageDisappearingSettings()).toEqual({
      fromNs: 5_000_000n,
      inNs: 5_000_000n,
    });
    expect(await conversation2!.isMessageDisappearingEnabled()).toBe(true);

    // wait for the messages to be deleted
    await sleep(5000);

    // verify that the messages are deleted
    expect((await conversation.messages()).length).toBe(1);

    // verify that the messages are deleted on the other client
    expect((await conversation2!.messages()).length).toBe(0);

    // remove the message disappearing settings
    await conversation.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(await conversation.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });

    expect(await conversation.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await conversation2!.sync();

    // verify that the message disappearing settings are set and disabled
    expect(await conversation2!.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });
    expect(await conversation2!.isMessageDisappearingEnabled()).toBe(false);

    // send messages to the group
    await conversation2!.send("gm");
    await conversation2!.send("gm2");

    // verify that the messages are sent
    expect((await conversation2!.messages()).length).toBe(4);

    // sync original group
    await conversation.sync();

    // verify that the messages are not deleted
    expect((await conversation.messages()).length).toBe(5);
  });

  it("should handle disappearing messages in a DM group", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);

    // create message disappearing settings so that messages are deleted after 1 second
    const messageDisappearingSettings: SafeMessageDisappearingSettings = {
      fromNs: 5_000_000n,
      inNs: 5_000_000n,
    };

    // create a group with message disappearing settings
    const conversation = await client1.conversations.newDm(
      user2.account.address,
      {
        messageDisappearingSettings,
      },
    );

    // verify that the message disappearing settings are set and enabled
    expect(await conversation.messageDisappearingSettings()).toEqual({
      fromNs: 5_000_000n,
      inNs: 5_000_000n,
    });
    expect(await conversation.isMessageDisappearingEnabled()).toBe(true);

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
    await conversation2!.sync();

    // verify that the message disappearing settings are set and enabled
    expect(await conversation2!.messageDisappearingSettings()).toEqual({
      fromNs: 5_000_000n,
      inNs: 5_000_000n,
    });
    expect(await conversation2!.isMessageDisappearingEnabled()).toBe(true);

    // wait for the messages to be deleted
    await sleep(5000);

    // verify that the messages are deleted
    expect((await conversation.messages()).length).toBe(1);

    // verify that the messages are deleted on the other client
    expect((await conversation2!.messages()).length).toBe(0);

    // remove the message disappearing settings
    await conversation.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(await conversation.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });

    expect(await conversation.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await conversation2!.sync();

    // verify that the message disappearing settings are set and disabled
    expect(await conversation2!.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });
    expect(await conversation2!.isMessageDisappearingEnabled()).toBe(false);

    // send messages to the group
    await conversation2!.send("gm");
    await conversation2!.send("gm2");

    // verify that the messages are sent
    expect((await conversation2!.messages()).length).toBe(4);

    // sync original group
    await conversation.sync();

    // verify that the messages are not deleted
    expect((await conversation.messages()).length).toBe(5);
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

    const conversation2 = await client2.conversations.list();
    expect(conversation2.length).toBe(1);
    expect(conversation2[0].id).toBe(conversation.id);

    const streamedMessages: string[] = [];
    const stream = await conversation2[0].stream((_, message) => {
      streamedMessages.push(message!.content as string);
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
});
