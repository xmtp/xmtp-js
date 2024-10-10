import { NapiGroupPermissionsOptions } from "@xmtp/mls-client-bindings-node";
import { describe, expect, it } from "vitest";
import { createRegisteredClient, createUser } from "@test/helpers";

describe("Conversations", () => {
  it("should not have initial conversations", async () => {
    const user = createUser();
    const client = await createRegisteredClient(user);
    const conversations = client.conversations.list();
    expect((await conversations).length).toBe(0);
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
      NapiGroupPermissionsOptions.AllMembers,
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
        permissions: NapiGroupPermissionsOptions.AdminOnly,
      },
    );
    expect(groupWithPermissions).toBeDefined();
    expect(groupWithPermissions.name).toBe("");
    expect(groupWithPermissions.imageUrl).toBe("");
    expect(groupWithPermissions.permissions.policyType).toBe(
      NapiGroupPermissionsOptions.AdminOnly,
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
    stream.stop();
    expect(
      client3.conversations.getConversationById(conversation1.id)?.id,
    ).toBe(conversation1.id);
    expect(
      client3.conversations.getConversationById(conversation2.id)?.id,
    ).toBe(conversation2.id);
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
    stream.stop();
  });
});
