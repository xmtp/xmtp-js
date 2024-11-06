import { ConsentState, GroupPermissionsOptions } from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import { createRegisteredClient, createUser } from "@test/helpers";

describe("Conversations", () => {
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
    const conversation = await client1.conversations.newConversation([
      user2.account.address,
    ]);
    expect(conversation).toBeDefined();
    expect(client1.conversations.getConversationById(conversation.id)?.id).toBe(
      conversation.id,
    );
    expect(conversation.id).toBeDefined();
    expect(conversation.createdAt).toBeDefined();
    expect(conversation.createdAtNs).toBeDefined();
    expect(conversation.isActive).toBe(true);
    expect(conversation.name).toBe("");
    expect(conversation.permissions.policyType).toBe(
      GroupPermissionsOptions.AllMembers,
    );
    expect(conversation.permissions.policySet).toEqual({
      addMemberPolicy: 0,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 0,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateGroupPinnedFrameUrlPolicy: 0,
    });
    expect(conversation.addedByInboxId).toBe(client1.inboxId);
    expect(conversation.messages().length).toBe(1);

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
    expect(group.permissions.policyType).toBe(
      GroupPermissionsOptions.CustomPolicy,
    );
    expect(group.permissions.policySet).toEqual({
      addAdminPolicy: 1,
      addMemberPolicy: 1,
      removeAdminPolicy: 1,
      removeMemberPolicy: 1,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateGroupNamePolicy: 0,
      updateGroupPinnedFrameUrlPolicy: 0,
    });
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect(group.messages().length).toBe(1);
    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(group.metadata.conversationType).toBe("dm");
    expect(group.metadata.creatorInboxId).toBe(client1.inboxId);

    expect(group.consentState).toBe(ConsentState.Allowed);

    const group1 = await client1.conversations.list();
    expect(group1.length).toBe(1);
    expect(group1[0].id).toBe(group.id);
    expect(group1[0].dmPeerInboxId).toBe(client2.inboxId);

    expect((await client1.conversations.listDms()).length).toBe(1);
    expect((await client1.conversations.listGroups()).length).toBe(0);

    expect((await client2.conversations.list()).length).toBe(0);

    await client2.conversations.sync();

    const group2 = await client2.conversations.list();
    expect(group2.length).toBe(1);
    expect(group2[0].id).toBe(group.id);
    expect(group2[0].dmPeerInboxId).toBe(client1.inboxId);

    expect((await client2.conversations.listDms()).length).toBe(1);
    expect((await client2.conversations.listGroups()).length).toBe(0);

    const dm1 = client1.conversations.getDmByInboxId(client2.inboxId);
    expect(dm1).toBeDefined();
    expect(dm1!.id).toBe(group.id);

    const dm2 = client2.conversations.getDmByInboxId(client1.inboxId);
    expect(dm2).toBeDefined();
    expect(dm2!.id).toBe(group.id);
  });

  it("should get a group by ID", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const group = await client1.conversations.newConversation([
      user2.account.address,
    ]);
    expect(group).toBeDefined();
    expect(group.id).toBeDefined();
    const foundGroup = client1.conversations.getConversationById(group.id);
    expect(foundGroup).toBeDefined();
    expect(foundGroup!.id).toBe(group.id);
  });

  it("should get a message by ID", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const client1 = await createRegisteredClient(user1);
    await createRegisteredClient(user2);
    const group = await client1.conversations.newConversation([
      user2.account.address,
    ]);
    const messageId = await group.send("gm!");
    expect(messageId).toBeDefined();

    const message = client1.conversations.getMessageById(messageId);
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
    const groupWithName = await client1.conversations.newConversation(
      [user2.account.address],
      {
        groupName: "foo",
      },
    );
    expect(groupWithName).toBeDefined();
    expect(groupWithName.name).toBe("foo");
    expect(groupWithName.imageUrl).toBe("");

    const groupWithImageUrl = await client1.conversations.newConversation(
      [user3.account.address],
      {
        groupImageUrlSquare: "https://foo/bar.png",
      },
    );
    expect(groupWithImageUrl).toBeDefined();
    expect(groupWithImageUrl.name).toBe("");
    expect(groupWithImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithNameAndImageUrl =
      await client1.conversations.newConversation([user4.account.address], {
        groupImageUrlSquare: "https://foo/bar.png",
        groupName: "foo",
      });
    expect(groupWithNameAndImageUrl).toBeDefined();
    expect(groupWithNameAndImageUrl.name).toBe("foo");
    expect(groupWithNameAndImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithPermissions = await client1.conversations.newConversation(
      [user4.account.address],
      {
        permissions: GroupPermissionsOptions.AdminOnly,
      },
    );
    expect(groupWithPermissions).toBeDefined();
    expect(groupWithPermissions.name).toBe("");
    expect(groupWithPermissions.imageUrl).toBe("");
    expect(groupWithPermissions.permissions.policyType).toBe(
      GroupPermissionsOptions.AdminOnly,
    );

    expect(groupWithPermissions.permissions.policySet).toEqual({
      addMemberPolicy: 2,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 2,
      updateGroupDescriptionPolicy: 2,
      updateGroupImageUrlSquarePolicy: 2,
      updateGroupPinnedFrameUrlPolicy: 2,
    });

    const groupWithDescription = await client1.conversations.newConversation(
      [user2.account.address],
      {
        groupDescription: "foo",
      },
    );
    expect(groupWithDescription).toBeDefined();
    expect(groupWithDescription.name).toBe("");
    expect(groupWithDescription.imageUrl).toBe("");
    expect(groupWithDescription.description).toBe("foo");

    const groupWithPinnedFrameUrl = await client1.conversations.newConversation(
      [user2.account.address],
      {
        groupPinnedFrameUrl: "https://foo/bar",
      },
    );
    expect(groupWithPinnedFrameUrl).toBeDefined();
    expect(groupWithPinnedFrameUrl.name).toBe("");
    expect(groupWithPinnedFrameUrl.imageUrl).toBe("");
    expect(groupWithPinnedFrameUrl.description).toBe("");
    expect(groupWithPinnedFrameUrl.pinnedFrameUrl).toBe("https://foo/bar");
  });

  it("should stream new conversations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const stream = client3.conversations.stream();
    const conversation1 = await client1.conversations.newConversation([
      user3.account.address,
    ]);
    const conversation2 = await client2.conversations.newConversation([
      user3.account.address,
    ]);
    let count = 0;
    for await (const convo of stream) {
      count++;
      expect(convo).toBeDefined();
      if (count === 1) {
        expect(convo!.id).toBe(conversation1.id);
      }
      if (count === 2) {
        expect(convo!.id).toBe(conversation2.id);
        break;
      }
    }
    expect(
      client3.conversations.getConversationById(conversation1.id)?.id,
    ).toBe(conversation1.id);
    expect(
      client3.conversations.getConversationById(conversation2.id)?.id,
    ).toBe(conversation2.id);
  });

  it("should only stream group conversations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const client4 = await createRegisteredClient(user4);
    const stream = client3.conversations.streamGroups();
    await client4.conversations.newDm(user3.account.address);
    const group1 = await client1.conversations.newConversation([
      user3.account.address,
    ]);
    const group2 = await client2.conversations.newConversation([
      user3.account.address,
    ]);
    let count = 0;
    for await (const convo of stream) {
      count++;
      expect(convo).toBeDefined();
      if (count === 1) {
        expect(convo!.id).toBe(group1.id);
      }
      if (count === 2) {
        expect(convo!.id).toBe(group2.id);
        break;
      }
    }
  });

  it("should only stream dm conversations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const client4 = await createRegisteredClient(user4);
    const stream = client3.conversations.streamDms();
    await client1.conversations.newConversation([user3.account.address]);
    await client2.conversations.newConversation([user3.account.address]);
    const group3 = await client4.conversations.newDm(user3.account.address);
    let count = 0;
    for await (const convo of stream) {
      count++;
      expect(convo).toBeDefined();
      if (count === 1) {
        expect(convo!.id).toBe(group3.id);
        break;
      }
    }
    expect(count).toBe(1);
  });

  it("should stream all messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    await client1.conversations.newConversation([user2.account.address]);
    await client1.conversations.newConversation([user3.account.address]);

    const stream = await client1.conversations.streamAllMessages();

    await client2.conversations.sync();
    const groups2 = await client2.conversations.list();

    await client3.conversations.sync();
    const groups3 = await client3.conversations.list();

    await groups2[0].send("gm!");
    await groups3[0].send("gm2!");

    let count = 0;

    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message!.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message!.senderInboxId).toBe(client3.inboxId);
        break;
      }
    }
  });

  it("should only stream group conversation messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const client4 = await createRegisteredClient(user4);
    await client1.conversations.newConversation([user2.account.address]);
    await client1.conversations.newConversation([user3.account.address]);
    await client1.conversations.newDm(user4.account.address);

    const stream = await client1.conversations.streamAllGroupMessages();

    const groups2 = client2.conversations;
    await groups2.sync();
    const groupsList2 = await groups2.list();

    const groups3 = client3.conversations;
    await groups3.sync();
    const groupsList3 = await groups3.list();

    const groups4 = client4.conversations;
    await groups4.sync();
    const groupsList4 = await groups4.list();

    await groupsList4[0].send("gm3!");
    await groupsList2[0].send("gm!");
    await groupsList3[0].send("gm2!");

    let count = 0;

    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message!.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message!.senderInboxId).toBe(client3.inboxId);
        break;
      }
    }
  });

  it("should only stream dm messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const client1 = await createRegisteredClient(user1);
    const client2 = await createRegisteredClient(user2);
    const client3 = await createRegisteredClient(user3);
    const client4 = await createRegisteredClient(user4);
    await client1.conversations.newConversation([user2.account.address]);
    await client1.conversations.newConversation([user3.account.address]);
    await client1.conversations.newDm(user4.account.address);

    const stream = await client1.conversations.streamAllDmMessages();

    const groups2 = client2.conversations;
    await groups2.sync();
    const groupsList2 = await groups2.list();

    const groups3 = client3.conversations;
    await groups3.sync();
    const groupsList3 = await groups3.list();

    const groups4 = client4.conversations;
    await groups4.sync();
    const groupsList4 = await groups4.list();

    await groupsList2[0].send("gm!");
    await groupsList3[0].send("gm2!");
    await groupsList4[0].send("gm3!");

    let count = 0;

    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message!.senderInboxId).toBe(client4.inboxId);
        break;
      }
    }
  });
});
