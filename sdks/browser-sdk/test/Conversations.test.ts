import { ConsentState, GroupPermissionsOptions } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import { createRegisteredClient, createUser } from "@test/helpers";

describe.concurrent("Conversations", () => {
  it("should not have initial conversations", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);

    expect((await client.conversations.list()).length).toBe(0);
    expect((await client.conversations.listDms()).length).toBe(0);
    expect((await client.conversations.listGroups()).length).toBe(0);
  });

  it("should create a new conversation", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const conversation = await client1.conversations.newGroup([
      user2.account.address,
    ]);
    expect(conversation).toBeDefined();
    expect(
      (await client1.conversations.getConversationById(conversation.id))?.id,
    ).toBe(conversation.id);
    expect(conversation.id).toBeDefined();
    expect(conversation.createdAtNs).toBeDefined();
    expect(conversation.createdAt).toBeDefined();
    expect(conversation.isActive).toBe(true);
    expect(conversation.name).toBe("");
    const permissions = await conversation.permissions();
    expect(permissions.policyType).toBe(GroupPermissionsOptions.Default);
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
    expect(conversation.addedByInboxId).toBe(client1.inboxId);
    expect((await conversation.messages()).length).toBe(1);

    const members = await conversation.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(conversation.metadata).toEqual({
      conversationType: "group",
      creatorInboxId: client1.inboxId,
    });

    const conversations1 = await client1.conversations.list();
    expect(conversations1.length).toBe(1);
    expect(conversations1[0].id).toBe(conversation.id);

    expect((await client2.conversations.list()).length).toBe(0);

    await client2.conversations.sync();

    const conversations2 = await client2.conversations.list();
    expect(conversations2.length).toBe(1);
    expect(conversations2[0].id).toBe(conversation.id);

    expect((await client2.conversations.listDms()).length).toBe(0);
    expect((await client2.conversations.listGroups()).length).toBe(1);
  });

  it("should create a dm group", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const group = await client1.conversations.newDm(user2.account.address);
    expect(group).toBeDefined();
    expect(group.id).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.isActive).toBe(true);
    expect(group.name).toBe("");
    const permissions = await group.permissions();
    expect(permissions.policyType).toBe(GroupPermissionsOptions.CustomPolicy);
    expect(permissions.policySet).toEqual({
      addAdminPolicy: 1,
      addMemberPolicy: 1,
      removeAdminPolicy: 1,
      removeMemberPolicy: 1,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateGroupNamePolicy: 0,
      updateMessageDisappearingPolicy: 0,
    });
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(0);
    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(group.metadata?.conversationType).toBe("dm");
    expect(group.metadata?.creatorInboxId).toBe(client1.inboxId);

    expect(await group.consentState()).toBe(ConsentState.Allowed);

    const group1 = await client1.conversations.list();
    expect(group1.length).toBe(1);
    expect(group1[0].id).toBe(group.id);
    expect(await group1[0].dmPeerInboxId()).toBe(client2.inboxId);

    expect((await client1.conversations.listDms()).length).toBe(1);
    expect((await client1.conversations.listGroups()).length).toBe(0);

    expect((await client2.conversations.list()).length).toBe(0);

    await client2.conversations.sync();

    const group2 = await client2.conversations.list();
    expect(group2.length).toBe(1);
    expect(group2[0].id).toBe(group.id);
    expect(await group2[0].dmPeerInboxId()).toBe(client1.inboxId);

    expect((await client2.conversations.listDms()).length).toBe(1);
    expect((await client2.conversations.listGroups()).length).toBe(0);

    const dm1 = await client1.conversations.getDmByInboxId(client2.inboxId!);
    expect(dm1).toBeDefined();
    expect(dm1!.id).toBe(group.id);

    const peerInboxId = await dm1?.dmPeerInboxId();
    expect(peerInboxId).toBeDefined();
    expect(peerInboxId).toBe(client2.inboxId);

    const dm2 = await client2.conversations.getDmByInboxId(client1.inboxId!);
    expect(dm2).toBeDefined();
    expect(dm2!.id).toBe(group.id);

    const peerInboxId2 = await dm2?.dmPeerInboxId();
    expect(peerInboxId2).toBeDefined();
    expect(peerInboxId2).toBe(client1.inboxId);
  });

  it("should get a group by ID", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const group = await client1.conversations.newGroup([user2.account.address]);
    expect(group).toBeDefined();
    expect(group.id).toBeDefined();
    const foundGroup = await client1.conversations.getConversationById(
      group.id,
    );
    expect(foundGroup).toBeDefined();
    expect(foundGroup!.id).toBe(group.id);
  });

  it("should get a message by ID", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const group = await client1.conversations.newGroup([user2.account.address]);
    const messageId = await group.send("gm!");
    expect(messageId).toBeDefined();

    const message = await client1.conversations.getMessageById(messageId);
    expect(message).toBeDefined();
    expect(message!.id).toBe(messageId);
  });

  it("should create a new conversation with options", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const user5 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    await createRegisteredClient(user3);
    await createRegisteredClient(user4);
    await createRegisteredClient(user5);
    const groupWithName = await client1.conversations.newGroup(
      [user2.account.address],
      {
        name: "foo",
      },
    );
    expect(groupWithName).toBeDefined();
    expect(groupWithName.name).toBe("foo");
    expect(groupWithName.imageUrl).toBe("");

    const groupWithImageUrl = await client1.conversations.newGroup(
      [user3.account.address],
      {
        imageUrlSquare: "https://foo/bar.png",
      },
    );
    expect(groupWithImageUrl).toBeDefined();
    expect(groupWithImageUrl.name).toBe("");
    expect(groupWithImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithNameAndImageUrl = await client1.conversations.newGroup(
      [user4.account.address],
      {
        imageUrlSquare: "https://foo/bar.png",
        name: "foo",
      },
    );
    expect(groupWithNameAndImageUrl).toBeDefined();
    expect(groupWithNameAndImageUrl.name).toBe("foo");
    expect(groupWithNameAndImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithPermissions = await client1.conversations.newGroup(
      [user4.account.address],
      {
        permissions: GroupPermissionsOptions.AdminOnly,
      },
    );
    expect(groupWithPermissions).toBeDefined();
    expect(groupWithPermissions.name).toBe("");
    expect(groupWithPermissions.imageUrl).toBe("");

    const permissions = await groupWithPermissions.permissions();
    expect(permissions.policyType).toBe(GroupPermissionsOptions.AdminOnly);
    expect(permissions.policySet).toEqual({
      addMemberPolicy: 2,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateMessageDisappearingPolicy: 2,
    });

    const groupWithDescription = await client1.conversations.newGroup(
      [user2.account.address],
      {
        description: "foo",
      },
    );
    expect(groupWithDescription).toBeDefined();
    expect(groupWithDescription.name).toBe("");
    expect(groupWithDescription.imageUrl).toBe("");
    expect(groupWithDescription.description).toBe("foo");
  });

  it("should create a group with custom permissions", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const group = await client1.conversations.newGroup(
      [user2.account.address],
      {
        permissions: GroupPermissionsOptions.CustomPolicy,
        customPermissionPolicySet: {
          addAdminPolicy: 1,
          addMemberPolicy: 0,
          removeAdminPolicy: 1,
          removeMemberPolicy: 1,
          updateGroupNamePolicy: 1,
          updateGroupDescriptionPolicy: 1,
          updateGroupImageUrlSquarePolicy: 1,
          updateMessageDisappearingPolicy: 1,
        },
      },
    );
    expect(group).toBeDefined();

    const permissions = await group.permissions();
    expect(permissions.policyType).toBe(GroupPermissionsOptions.CustomPolicy);
    expect(permissions.policySet).toEqual({
      addAdminPolicy: 1,
      addMemberPolicy: 0,
      removeAdminPolicy: 1,
      removeMemberPolicy: 1,
      updateGroupNamePolicy: 1,
      updateGroupDescriptionPolicy: 1,
      updateGroupImageUrlSquarePolicy: 1,
      updateMessageDisappearingPolicy: 1,
    });
  });

  it("should get conversation HMAC keys", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    await createRegisteredClient(user3);
    await createRegisteredClient(user4);
    const group1 = await client1.conversations.newGroup([
      user2.account.address,
    ]);
    const group2 = await client1.conversations.newGroup([
      user3.account.address,
    ]);
    const group3 = await client1.conversations.newGroup([
      user4.account.address,
    ]);
    const hmacKeys = await client1.conversations.getHmacKeys();
    expect(hmacKeys).toBeDefined();
    const groupIds = Object.keys(hmacKeys);
    expect(groupIds).toContain(group1.id);
    expect(groupIds).toContain(group2.id);
    expect(groupIds).toContain(group3.id);
    Object.values(hmacKeys).forEach((keys) => {
      keys.forEach((key) => {
        expect(key.epoch).toBeDefined();
        expect(key.epoch).toBeGreaterThan(0);
        expect(key.key).toBeDefined();
        expect(key.key.length).toBe(42);
      });
    });
  });

  it("should sync groups across installations", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    user.uuid = v4();
    const client2 = await createRegisteredClient(user);
    const user2 = createUser();
    await createRegisteredClient(user2);

    const group = await client.conversations.newGroup([user2.account.address]);
    await client2.conversations.sync();
    const convos = await client2.conversations.list();
    expect(convos.length).toBe(1);
    expect(convos[0].id).toBe(group.id);

    const group2 = await client.conversations.newDm(user2.account.address);
    await client2.conversations.sync();
    const convos2 = await client2.conversations.list();
    expect(convos2.length).toBe(2);
    expect(convos2[0].id).toBe(group.id);
    expect(convos2[1].id).toBe(group2.id);
  });
});
