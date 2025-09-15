import { ConsentState, GroupPermissionsOptions } from "@xmtp/node-bindings";
import { v4 } from "uuid";
import { describe, expect, it } from "vitest";
import {
  createRegisteredClient,
  createSigner,
  createUser,
  sleep,
} from "@test/helpers";

describe("Conversations", () => {
  it("should not have initial conversations", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);

    expect((await client.conversations.list()).length).toBe(0);
    expect(client.conversations.listDms().length).toBe(0);
    expect(client.conversations.listGroups().length).toBe(0);
  });

  it("should create a group", async () => {
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
    expect(conversation).toBeDefined();
    expect(
      (await client1.conversations.getConversationById(conversation.id))?.id,
    ).toBe(conversation.id);
    expect(conversation.id).toBeDefined();
    expect(conversation.createdAt).toBeDefined();
    expect(conversation.createdAtNs).toBeDefined();
    expect(conversation.isActive).toBe(true);
    expect(conversation.isCommitLogForked).toBe(null);
    expect(conversation.name).toBe("");
    expect(conversation.permissions.policyType).toBe(
      GroupPermissionsOptions.Default,
    );
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
    expect(conversation.addedByInboxId).toBe(client1.inboxId);
    expect((await conversation.messages()).length).toBe(1);

    const members = await conversation.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(await conversation.metadata()).toEqual({
      conversationType: "group",
      creatorInboxId: client1.inboxId,
    });

    const conversations1 = client1.conversations.listGroups();
    expect(conversations1.length).toBe(1);
    expect(conversations1[0].id).toBe(conversation.id);

    expect(client2.conversations.listGroups().length).toBe(0);

    await client2.conversations.sync();

    const conversations2 = client2.conversations.listGroups();
    expect(conversations2.length).toBe(1);
    expect(conversations2[0].id).toBe(conversation.id);

    expect(client2.conversations.listDms().length).toBe(0);
    expect(client2.conversations.listGroups().length).toBe(1);

    const conversation2 = await client1.conversations.newGroup([
      client3.inboxId,
    ]);
    expect(conversation2).toBeDefined();
    expect(conversation2.id).toBeDefined();
    expect(conversation2.createdAt).toBeDefined();
    expect(conversation2.createdAtNs).toBeDefined();
    expect(conversation2.isActive).toBe(true);
    expect(conversation2.name).toBe("");
    expect(conversation2.permissions.policyType).toBe(
      GroupPermissionsOptions.Default,
    );
    expect(conversation2.permissions.policySet).toEqual({
      addMemberPolicy: 0,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 0,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateMessageDisappearingPolicy: 2,
    });
    expect(conversation2.addedByInboxId).toBe(client1.inboxId);
    expect((await conversation2.messages()).length).toBe(1);

    const members2 = await conversation2.members();
    expect(members2.length).toBe(2);
    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);
    expect(await conversation2.metadata()).toEqual({
      conversationType: "group",
      creatorInboxId: client1.inboxId,
    });

    const conversations3 = client3.conversations.listGroups();
    expect(conversations3.length).toBe(0);

    await client3.conversations.sync();

    const conversations4 = client3.conversations.listGroups();
    expect(conversations4.length).toBe(1);
    expect(conversations4[0].id).toBe(conversation2.id);

    expect(client2.conversations.listDms().length).toBe(0);
    expect(client2.conversations.listGroups().length).toBe(1);
  });

  it("should create a dm", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const group = await client1.conversations.newDm(client2.inboxId);
    expect(group).toBeDefined();
    expect(group.id).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.isActive).toBe(true);
    expect(group.isCommitLogForked).toBe(null);
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(1);
    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect((await group.metadata()).conversationType).toBe("dm");
    expect((await group.metadata()).creatorInboxId).toBe(client1.inboxId);

    expect(group.consentState).toBe(ConsentState.Allowed);

    const group1 = client1.conversations.listDms();
    expect(group1.length).toBe(1);
    expect(group1[0].id).toBe(group.id);
    expect(group1[0].peerInboxId).toBe(client2.inboxId);

    expect(client1.conversations.listDms().length).toBe(1);
    expect(client1.conversations.listGroups().length).toBe(0);

    expect(client2.conversations.listDms().length).toBe(0);

    await client2.conversations.sync();

    const group2 = client2.conversations.listDms();
    expect(group2.length).toBe(1);
    expect(group2[0].id).toBe(group.id);
    expect(group2[0].peerInboxId).toBe(client1.inboxId);

    expect(client2.conversations.listDms().length).toBe(1);
    expect(client2.conversations.listGroups().length).toBe(0);

    const dm1 = client1.conversations.getDmByInboxId(client2.inboxId);
    expect(dm1).toBeDefined();
    expect(dm1!.id).toBe(group.id);

    const dm2 = client2.conversations.getDmByInboxId(client1.inboxId);
    expect(dm2).toBeDefined();
    expect(dm2!.id).toBe(group.id);

    const group3 = await client1.conversations.newDm(client3.inboxId);
    expect(group3).toBeDefined();
    expect(group3.id).toBeDefined();
    expect(group3.peerInboxId).toBe(client3.inboxId);
    expect(group3.addedByInboxId).toBe(client1.inboxId);
    expect((await group3.messages()).length).toBe(1);
    const members3 = await group3.members();
    expect(members3.length).toBe(2);
    const memberInboxIds3 = members3.map((member) => member.inboxId);
    expect(memberInboxIds3).toContain(client1.inboxId);
    expect(memberInboxIds3).toContain(client3.inboxId);
    expect(await group3.metadata()).toEqual({
      conversationType: "dm",
      creatorInboxId: client1.inboxId,
    });

    expect(client3.conversations.listDms().length).toBe(0);

    await client3.conversations.sync();

    const groups4 = client3.conversations.listDms();
    expect(groups4.length).toBe(1);
    expect(groups4[0].id).toBe(group3.id);
    expect(groups4[0].peerInboxId).toBe(client1.inboxId);

    expect(client3.conversations.listDms().length).toBe(1);
    expect(client3.conversations.listGroups().length).toBe(0);

    const dm3 = client1.conversations.getDmByInboxId(client3.inboxId);
    expect(dm3).toBeDefined();
    expect(dm3!.id).toBe(group3.id);

    const dm4 = client3.conversations.getDmByInboxId(client1.inboxId);
    expect(dm4).toBeDefined();
    expect(dm4!.id).toBe(group3.id);

    const dupeDms1 = await group.getDuplicateDms();
    const dupeDms2 = await group3.getDuplicateDms();
    expect(dupeDms1.length).toEqual(0);
    expect(dupeDms2.length).toEqual(0);
  });

  it("should create groups with identifiers", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    await createRegisteredClient(signer2);
    await createRegisteredClient(signer3);
    const group = await client1.conversations.newGroupWithIdentifiers([
      await signer2.getIdentifier(),
    ]);
    expect(group).toBeDefined();
    const dm = await client1.conversations.newDmWithIdentifier(
      await signer3.getIdentifier(),
    );
    expect(dm).toBeDefined();
  });

  it("should get a group by ID", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
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
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    const messageId = await group.send("gm!");
    expect(messageId).toBeDefined();

    const message = client1.conversations.getMessageById(messageId);
    expect(message).toBeDefined();
    expect(message!.id).toBe(messageId);
  });

  it("should create a group with options", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const signer4 = createSigner(user4);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    const groupWithName = await client1.conversations.newGroup(
      [client2.inboxId],
      {
        groupName: "foo",
      },
    );
    expect(groupWithName).toBeDefined();
    expect(groupWithName.name).toBe("foo");
    expect(groupWithName.imageUrl).toBe("");

    const groupWithImageUrl = await client1.conversations.newGroup(
      [client3.inboxId],
      {
        groupImageUrlSquare: "https://foo/bar.png",
      },
    );
    expect(groupWithImageUrl).toBeDefined();
    expect(groupWithImageUrl.name).toBe("");
    expect(groupWithImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithNameAndImageUrl = await client1.conversations.newGroup(
      [client4.inboxId],
      {
        groupImageUrlSquare: "https://foo/bar.png",
        groupName: "foo",
      },
    );
    expect(groupWithNameAndImageUrl).toBeDefined();
    expect(groupWithNameAndImageUrl.name).toBe("foo");
    expect(groupWithNameAndImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithPermissions = await client1.conversations.newGroup(
      [client4.inboxId],
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
      updateMessageDisappearingPolicy: 2,
    });

    const groupWithDescription = await client1.conversations.newGroup(
      [client2.inboxId],
      {
        groupDescription: "foo",
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
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId], {
      permissions: GroupPermissionsOptions.CustomPolicy,
      customPermissionPolicySet: {
        addAdminPolicy: 1,
        addMemberPolicy: 0,
        removeAdminPolicy: 1,
        removeMemberPolicy: 1,
        updateGroupNamePolicy: 1,
        updateGroupDescriptionPolicy: 1,
        updateGroupImageUrlSquarePolicy: 1,
        updateMessageDisappearingPolicy: 2,
      },
    });
    expect(group).toBeDefined();
    expect(group.permissions.policyType).toBe(
      GroupPermissionsOptions.CustomPolicy,
    );
    expect(group.permissions.policySet).toEqual({
      addAdminPolicy: 1,
      addMemberPolicy: 0,
      removeAdminPolicy: 1,
      removeMemberPolicy: 1,
      updateGroupNamePolicy: 1,
      updateGroupDescriptionPolicy: 1,
      updateGroupImageUrlSquarePolicy: 1,
      updateMessageDisappearingPolicy: 2,
    });
  });

  it("should stream new conversations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const stream = await client3.conversations.stream();
    const conversation1 = await client1.conversations.newGroup([
      client3.inboxId,
    ]);
    const conversation2 = await client2.conversations.newGroup([
      client3.inboxId,
    ]);

    const expectedIds = [conversation1.id, conversation2.id];
    const receivedIds: string[] = [];

    setTimeout(() => {
      void stream.end();
    }, 2000);

    for await (const convo of stream) {
      if (convo === undefined) {
        break;
      }
      expect(convo).toBeDefined();
      receivedIds.push(convo.id);
    }

    expect(receivedIds.length).toBe(2);
    expect(receivedIds.sort()).toEqual(expectedIds.sort());
    expect(
      (await client3.conversations.getConversationById(conversation1.id))?.id,
    ).toBe(conversation1.id);
    expect(
      (await client3.conversations.getConversationById(conversation2.id))?.id,
    ).toBe(conversation2.id);
  });

  it("should only stream group conversations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const signer4 = createSigner(user4);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    const stream = await client3.conversations.streamGroups();
    await client4.conversations.newDm(client3.inboxId);
    const group1 = await client1.conversations.newGroup([client3.inboxId]);
    const group2 = await client2.conversations.newGroup([client3.inboxId]);

    const expectedIds = [group1.id, group2.id];
    const receivedIds: string[] = [];

    setTimeout(() => {
      void stream.end();
    }, 2000);

    for await (const convo of stream) {
      expect(convo).toBeDefined();
      receivedIds.push(convo.id);
    }
    expect(receivedIds.length).toBe(2);
    expect(receivedIds.sort()).toEqual(expectedIds.sort());
  });

  it("should only stream dm conversations", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const signer4 = createSigner(user4);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    const stream = await client3.conversations.streamDms();
    await client1.conversations.newGroup([client3.inboxId]);
    await client2.conversations.newGroup([client3.inboxId]);
    const group3 = await client4.conversations.newDm(client3.inboxId);

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const convo of stream) {
      count++;
      expect(convo).toBeDefined();
      if (count === 1) {
        expect(convo.id).toBe(group3.id);
      }
    }
    expect(count).toBe(1);
  });

  it("should stream all messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    await client1.conversations.newGroup([client2.inboxId]);
    await client1.conversations.newGroup([client3.inboxId]);

    await sleep(2000);

    const stream = await client1.conversations.streamAllMessages();

    await client2.conversations.sync();
    const groups2 = client2.conversations.listGroups();

    await client3.conversations.sync();
    const groups3 = client3.conversations.listGroups();

    await groups2[0].send("gm!");
    await groups3[0].send("gm2!");

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message.senderInboxId).toBe(client3.inboxId);
      }
    }
    expect(count).toBe(2);
  });

  it("should only stream group conversation messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const signer4 = createSigner(user4);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    await client1.conversations.newGroup([client2.inboxId]);
    await client1.conversations.newGroup([client3.inboxId]);
    await client1.conversations.newDm(client4.inboxId);

    await sleep(2000);

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

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client2.inboxId);
      }
      if (count === 2) {
        expect(message.senderInboxId).toBe(client3.inboxId);
      }
    }
    expect(count).toBe(2);
  });

  it("should only stream dm messages", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const user3 = createUser();
    const user4 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const signer3 = createSigner(user3);
    const signer4 = createSigner(user4);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    await client1.conversations.newGroup([client2.inboxId]);
    await client1.conversations.newGroup([client3.inboxId]);
    await client1.conversations.newDm(client4.inboxId);

    await sleep(2000);

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

    setTimeout(() => {
      void stream.end();
    }, 2000);

    let count = 0;
    for await (const message of stream) {
      count++;
      expect(message).toBeDefined();
      if (count === 1) {
        expect(message.senderInboxId).toBe(client4.inboxId);
      }
      expect(count).toBe(1);
    }
  });

  it("should get hmac keys", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    const dm = await client1.conversations.newDm(client2.inboxId);
    const hmacKeys = client1.conversations.hmacKeys();
    expect(hmacKeys).toBeDefined();
    const keys = Object.keys(hmacKeys);
    expect(keys.length).toBe(2);
    expect(keys).toContain(group.id);
    expect(keys).toContain(dm.id);
    for (const values of Object.values(hmacKeys)) {
      expect(values.length).toBe(3);
      for (const value of values) {
        expect(value.key).toBeDefined();
        expect(value.key.length).toBe(42);
        expect(value.epoch).toBeDefined();
        expect(typeof value.epoch).toBe("bigint");
      }
    }
  });

  it("should sync groups across installations", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const client = await createRegisteredClient(signer);
    const client2 = await createRegisteredClient(signer, {
      dbPath: `./test-${v4()}.db3`,
    });
    const user2 = createUser();
    const signer2 = createSigner(user2);
    await createRegisteredClient(signer2);

    const group = await client.conversations.newGroup([client2.inboxId]);
    await client2.conversations.sync();
    const convos = client2.conversations.listGroups();
    expect(convos.length).toBe(1);
    expect(convos[0].id).toBe(group.id);

    const group2 = await client.conversations.newDm(client2.inboxId);
    await client2.conversations.sync();
    const convos2 = await client2.conversations.list();
    expect(convos2.length).toBe(2);
    const convos2Ids = convos2.map((c) => c.id);
    expect(convos2Ids).toContain(group.id);
    expect(convos2Ids).toContain(group2.id);
  });

  it("should stitch DM groups together", async () => {
    const user1 = createUser();
    const user2 = createUser();
    const signer1 = createSigner(user1);
    const signer2 = createSigner(user2);
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const dm1 = await client1.conversations.newDm(client2.inboxId);
    const dm2 = await client2.conversations.newDm(client1.inboxId);

    await dm1.send("hi");
    // since this is the last message sent, the stitched group ID will be
    // this group ID
    await dm2.send("hi");

    await client1.conversations.sync();
    await client2.conversations.sync();
    await dm1.sync();
    await dm2.sync();

    const dm1_2 = await client1.conversations.getConversationById(dm1.id);
    const dm2_2 = await client2.conversations.getConversationById(dm2.id);
    expect(dm1_2?.id).toBe(dm2.id);
    expect(dm2_2?.id).toBe(dm2.id);

    const dms1 = client1.conversations.listDms();
    const dms2 = client2.conversations.listDms();
    expect(dms1[0].id).toBe(dm2.id);
    expect(dms2[0].id).toBe(dm2.id);

    const dupeDms1 = await dms1[0].getDuplicateDms();
    const dupeDms2 = await dms2[0].getDuplicateDms();
    expect(dupeDms1.length).toBe(1);
    expect(dupeDms2.length).toBe(1);
    expect(dupeDms1[0].id).toBe(dm1.id);
    expect(dupeDms2[0].id).toBe(dm1.id);
  });

  it("should create optimistic groups", async () => {
    const user1 = createUser();
    const signer1 = createSigner(user1);
    const client1 = await createRegisteredClient(signer1);
    const group = client1.conversations.newGroupOptimistic();
    expect(group).toBeDefined();
    expect(group.id).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.isActive).toBe(true);
    expect(group.name).toBe("");
    expect(group.permissions.policyType).toBe(GroupPermissionsOptions.Default);
    expect(group.permissions.policySet).toEqual({
      addMemberPolicy: 0,
      removeMemberPolicy: 2,
      addAdminPolicy: 3,
      removeAdminPolicy: 3,
      updateGroupNamePolicy: 0,
      updateGroupDescriptionPolicy: 0,
      updateGroupImageUrlSquarePolicy: 0,
      updateMessageDisappearingPolicy: 2,
    });
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(0);

    const group2 = client1.conversations.newGroupOptimistic({
      groupName: "test",
      groupDescription: "test",
      groupImageUrlSquare: "test",
      permissions: GroupPermissionsOptions.CustomPolicy,
      customPermissionPolicySet: {
        addAdminPolicy: 1,
        addMemberPolicy: 0,
        removeAdminPolicy: 1,
        removeMemberPolicy: 1,
        updateGroupNamePolicy: 1,
        updateGroupDescriptionPolicy: 1,
        updateGroupImageUrlSquarePolicy: 1,
        updateMessageDisappearingPolicy: 2,
      },
      messageDisappearingSettings: {
        fromNs: 1000,
        inNs: 1000,
      },
    });
    expect(group2).toBeDefined();
    expect(group2.id).toBeDefined();
    expect(group2.createdAtNs).toBeDefined();
    expect(group2.createdAt).toBeDefined();
    expect(group2.isActive).toBe(true);
    expect(group2.name).toBe("test");
    expect(group2.description).toBe("test");
    expect(group2.imageUrl).toBe("test");
    expect(group2.addedByInboxId).toBe(client1.inboxId);
    expect(group2.permissions.policyType).toBe(
      GroupPermissionsOptions.CustomPolicy,
    );
    expect(group2.permissions.policySet).toEqual({
      addAdminPolicy: 1,
      addMemberPolicy: 0,
      removeAdminPolicy: 1,
      removeMemberPolicy: 1,
      updateGroupNamePolicy: 1,
      updateGroupDescriptionPolicy: 1,
      updateGroupImageUrlSquarePolicy: 1,
      updateMessageDisappearingPolicy: 2,
    });
    expect(group2.isMessageDisappearingEnabled()).toBe(true);
    expect(group2.messageDisappearingSettings()).toEqual({
      fromNs: 1000,
      inNs: 1000,
    });

    expect((await group2.messages()).length).toBe(0);
  });
});
