import type {
  GroupUpdated,
  MessageDisappearingSettings,
} from "@xmtp/wasm-bindings";
import { describe, expect, it } from "vitest";
import type { DecodedMessage } from "@/DecodedMessage";
import { createRegisteredClient, createSigner, sleep } from "@test/helpers";

describe("Group", () => {
  it("should create a group", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.newGroup([client2.inboxId!]);
    expect(group).toBeDefined();
    expect(
      (await client1.conversations.getConversationById(group.id))?.id,
    ).toBe(group.id);
    expect(group.id).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(await group.isActive()).toBe(true);
    expect(group.isCommitLogForked).toBeUndefined();
    expect(group.name).toBe("");
    const permissions = await group.permissions();
    expect(permissions.policyType).toBe("default");
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
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(1);

    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(group.metadata).toEqual({
      conversationType: "group",
      creatorInboxId: client1.inboxId,
    });

    expect((await client1.conversations.listDms()).length).toBe(0);

    const groups = await client1.conversations.listGroups();
    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe(group.id);

    // confirm group in other client
    await client2.conversations.sync();
    const groups2 = await client2.conversations.listGroups();
    expect(groups2.length).toBe(1);
    expect(groups2[0].id).toBe(group.id);

    expect((await client2.conversations.listDms()).length).toBe(0);
  });

  it("should create a group with an identifier", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2, identifier: identifier2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroupWithIdentifiers([
      identifier2,
    ]);
    expect(group).toBeDefined();
    expect(
      (await client1.conversations.getConversationById(group.id))?.id,
    ).toBe(group.id);
    expect(group.id).toBeDefined();
    expect(group.createdAt).toBeDefined();
    expect(group.createdAtNs).toBeDefined();
    expect(await group.isActive()).toBe(true);
    expect(group.isCommitLogForked).toBeUndefined();
    expect(group.name).toBe("");
    const permissions = await group.permissions();
    expect(permissions.policyType).toBe("default");
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
    expect(group.addedByInboxId).toBe(client1.inboxId);
    expect((await group.messages()).length).toBe(1);

    const members = await group.members();
    expect(members.length).toBe(2);
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(group.metadata).toEqual({
      conversationType: "group",
      creatorInboxId: client1.inboxId,
    });

    const groups = await client1.conversations.listGroups();
    expect(groups.length).toBe(1);
    expect(groups[0].id).toBe(group.id);
    expect((await client1.conversations.listDms()).length).toBe(0);

    // confirm group in other client
    await client2.conversations.sync();
    const groups2 = await client2.conversations.listGroups();
    expect(groups2.length).toBe(1);
    expect(groups2[0].id).toBe(group.id);

    expect((await client2.conversations.listDms()).length).toBe(0);
  });

  it("should optimistically create a group", async () => {
    const { signer: signer1 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const group = await client1.conversations.newGroupOptimistic({
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
    expect(messages[0].deliveryStatus).toBe("unpublished");

    await group.publishMessages();

    const messages2 = await group.messages();
    expect(messages2.length).toBe(1);
    expect(messages2[0].content).toBe(text);
    expect(messages2[0].deliveryStatus).toBe("published");
  });

  it("should optimistically create a group with members", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroupOptimistic({
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
    expect(messages[0].deliveryStatus).toBe("unpublished");

    await group.addMembers([client2.inboxId!]);

    const members = await group.members();
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds.length).toBe(2);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);

    const messages3 = await group.messages();
    expect(messages3.length).toBe(2);
    expect(messages3[0].content).toBe(text);
    expect(messages3[0].deliveryStatus).toBe("published");
    expect(messages3[1].deliveryStatus).toBe("published");
  });

  it("should create a group with options", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const { signer: signer4 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const client4 = await createRegisteredClient(signer4);
    const groupWithName = await client1.conversations.newGroup(
      [client2.inboxId!],
      {
        groupName: "foo",
      },
    );
    expect(groupWithName).toBeDefined();
    expect(groupWithName.name).toBe("foo");
    expect(groupWithName.description).toBe("");
    expect(groupWithName.imageUrl).toBe("");

    const groupWithImageUrl = await client1.conversations.newGroup(
      [client3.inboxId!],
      {
        groupImageUrlSquare: "https://foo/bar.png",
      },
    );
    expect(groupWithImageUrl).toBeDefined();
    expect(groupWithImageUrl.name).toBe("");
    expect(groupWithImageUrl.description).toBe("");
    expect(groupWithImageUrl.imageUrl).toBe("https://foo/bar.png");

    const groupWithDescription = await client1.conversations.newGroup(
      [client2.inboxId!],
      {
        groupDescription: "foo",
      },
    );
    expect(groupWithDescription).toBeDefined();
    expect(groupWithDescription.name).toBe("");
    expect(groupWithDescription.imageUrl).toBe("");
    expect(groupWithDescription.description).toBe("foo");

    const groupWithPermissions = await client1.conversations.newGroup(
      [client4.inboxId!],
      {
        permissions: "adminOnly",
      },
    );
    expect(groupWithPermissions).toBeDefined();
    expect(groupWithPermissions.name).toBe("");
    expect(groupWithPermissions.imageUrl).toBe("");
    const permissions = await groupWithPermissions.permissions();
    expect(permissions.policyType).toBe("adminOnly");

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
  });

  it("should create a group with custom permissions", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!], {
      permissions: "customPolicy",
      customPermissionPolicySet: {
        addAdminPolicy: "deny",
        addMemberPolicy: "allow",
        removeAdminPolicy: "deny",
        removeMemberPolicy: "deny",
        updateGroupNamePolicy: "deny",
        updateGroupDescriptionPolicy: "deny",
        updateGroupImageUrlSquarePolicy: "deny",
        updateMessageDisappearingPolicy: "admin",
      },
    });
    expect(group).toBeDefined();
    const permissions = await group.permissions();
    expect(permissions.policyType).toBe("customPolicy");
    expect(permissions.policySet).toEqual({
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

  it("should update group name", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);
    const newName = "foo";
    await group.updateName(newName);
    expect(group.name).toBe(newName);
    const messages = await group.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const groups = await client2.conversations.listGroups();
    expect(groups.length).toBe(1);

    const group2 = groups[0];
    expect(group2).toBeDefined();
    await group2.sync();
    expect(group2.id).toBe(group.id);
    expect(group2.name).toBe(newName);
  });

  it("should update group image URL", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);
    const imageUrl = "https://foo/bar.jpg";
    await group.updateImageUrl(imageUrl);
    expect(group.imageUrl).toBe(imageUrl);
    const messages = await group.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const groups = await client2.conversations.listGroups();
    expect(groups.length).toBe(1);

    const group2 = groups[0];
    expect(group2).toBeDefined();
    await group2.sync();
    expect(group2.id).toBe(group.id);
    expect(group2.imageUrl).toBe(imageUrl);
  });

  it("should update group description", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);
    const newDescription = "foo";
    await group.updateDescription(newDescription);
    expect(group.description).toBe(newDescription);
    const messages = await group.messages();
    expect(messages.length).toBe(2);

    await client2.conversations.sync();
    const groups = await client2.conversations.listGroups();
    expect(groups.length).toBe(1);

    const group2 = groups[0];
    expect(group2).toBeDefined();
    await group2.sync();
    expect(group2.id).toBe(group.id);
    expect(group2.description).toBe(newDescription);
  });

  it("should update group app data", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);
    const appData = "foo";
    await group.updateAppData(appData);
    expect(group.appData).toBe(appData);
    const messages = await group.messages();
    expect(messages.length).toBe(2);

    // verify GroupUpdated message contains metadata field change
    const groupUpdatedMessages = messages.filter(
      (m) => m.contentType.typeId === "group_updated",
    ) as DecodedMessage<GroupUpdated>[];
    expect(groupUpdatedMessages.length).toBe(2);
    const appDataMessage = groupUpdatedMessages.find(
      (m) => m.content!.metadataFieldChanges.length > 0,
    ) as DecodedMessage<GroupUpdated>;
    expect(appDataMessage).toBeDefined();
    expect(appDataMessage.content!.metadataFieldChanges).toHaveLength(1);
    expect(appDataMessage.content!.metadataFieldChanges[0].fieldName).toBe(
      "app_data",
    );
    expect(appDataMessage.content!.metadataFieldChanges[0].newValue).toBe(
      appData,
    );

    await client2.conversations.sync();
    const conversation2 = (await client2.conversations.listGroups())[0];
    expect(conversation2).toBeDefined();
    await conversation2.sync();
    expect(conversation2.appData).toBe(appData);
  });

  it("should add and remove members", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    const members = await group.members();

    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await group.addMembers([client3.inboxId!]);

    const members2 = await group.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await group.removeMembers([client2.inboxId!]);

    const members3 = await group.members();
    expect(members3.length).toBe(2);

    const memberInboxIds3 = members3.map((member) => member.inboxId);
    expect(memberInboxIds3).toContain(client1.inboxId);
    expect(memberInboxIds3).not.toContain(client2.inboxId);
    expect(memberInboxIds3).toContain(client3.inboxId);
  });

  it("should add and remove members by inbox id", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const { signer: signer3 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const client3 = await createRegisteredClient(signer3);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    const members = await group.members();
    const memberInboxIds = members.map((member) => member.inboxId);
    expect(memberInboxIds).toContain(client1.inboxId);
    expect(memberInboxIds).toContain(client2.inboxId);
    expect(memberInboxIds).not.toContain(client3.inboxId);

    await group.addMembers([client3.inboxId!]);

    const members2 = await group.members();
    expect(members2.length).toBe(3);

    const memberInboxIds2 = members2.map((member) => member.inboxId);
    expect(memberInboxIds2).toContain(client1.inboxId);
    expect(memberInboxIds2).toContain(client2.inboxId);
    expect(memberInboxIds2).toContain(client3.inboxId);

    await group.removeMembers([client2.inboxId!]);

    const members3 = await group.members();
    expect(members3.length).toBe(2);

    const memberInboxIds3 = members3.map((member) => member.inboxId);
    expect(memberInboxIds3).toContain(client1.inboxId);
    expect(memberInboxIds3).not.toContain(client2.inboxId);
    expect(memberInboxIds3).toContain(client3.inboxId);
  });

  it("should send and list messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

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
    const groups = await client2.conversations.listGroups();
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
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    const text = "gm";
    await group.sendText(text, true);

    const messages = await group.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].content).toBe(text);

    await client2.conversations.sync();
    const groups = await client2.conversations.listGroups();
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

  it("should stream messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    await client2.conversations.sync();
    const groups = await client2.conversations.listGroups();
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

  it("should add and remove admins", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    expect(await group.isSuperAdmin(client1.inboxId!)).toBe(true);
    await group.listSuperAdmins();
    expect(group.superAdmins.length).toBe(1);
    expect(group.superAdmins).toContain(client1.inboxId);
    expect(await group.isAdmin(client1.inboxId!)).toBe(false);
    expect(await group.isAdmin(client2.inboxId!)).toBe(false);
    await group.listAdmins();
    expect(group.admins.length).toBe(0);

    await group.addAdmin(client2.inboxId!);
    expect(await group.isAdmin(client2.inboxId!)).toBe(true);
    await group.listAdmins();
    expect(group.admins.length).toBe(1);
    expect(group.admins).toContain(client2.inboxId);

    await group.removeAdmin(client2.inboxId!);
    expect(await group.isAdmin(client2.inboxId!)).toBe(false);
    await group.listAdmins();
    expect(group.admins.length).toBe(0);
  });

  it("should add and remove super admins", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    expect(await group.isSuperAdmin(client1.inboxId!)).toBe(true);
    expect(await group.isSuperAdmin(client2.inboxId!)).toBe(false);
    await group.listSuperAdmins();
    expect(group.superAdmins.length).toBe(1);
    expect(group.superAdmins).toContain(client1.inboxId);

    await group.addSuperAdmin(client2.inboxId!);
    expect(await group.isSuperAdmin(client2.inboxId!)).toBe(true);
    await group.listSuperAdmins();
    expect(group.superAdmins.length).toBe(2);
    expect(group.superAdmins).toContain(client1.inboxId);
    expect(group.superAdmins).toContain(client2.inboxId);

    await group.removeSuperAdmin(client2.inboxId!);
    expect(await group.isSuperAdmin(client2.inboxId!)).toBe(false);
    await group.listSuperAdmins();
    expect(group.superAdmins.length).toBe(1);
    expect(group.superAdmins).toContain(client1.inboxId);
  });

  it("should manage consent state", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);
    expect(group).toBeDefined();
    expect(await group.consentState()).toBe("allowed");

    await client2.conversations.sync();
    const group2 = await client2.conversations.getConversationById(group.id);
    expect(group2).toBeDefined();
    expect(await group2!.consentState()).toBe("unknown");
    await group2!.sendText("gm!");
    expect(await group2!.consentState()).toBe("allowed");
  });

  it("should update group permissions", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    const permissions = await group.permissions();
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

    await group.updatePermission("addMember", "admin");

    await group.updatePermission("removeMember", "superAdmin");

    await group.updatePermission("addAdmin", "admin");

    await group.updatePermission("removeAdmin", "admin");

    await group.updatePermission("updateMetadata", "admin", "groupName");

    await group.updatePermission("updateMetadata", "admin", "description");

    await group.updatePermission("updateMetadata", "admin", "imageUrlSquare");

    const permissions2 = await group.permissions();
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
  });

  it("should handle disappearing messages", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const stream = await client1.conversations.streamMessageDeletions();

    // create message disappearing settings so that messages are deleted after 1 second
    const messageDisappearingSettings: MessageDisappearingSettings = {
      fromNs: 1n,
      inNs: 2_000_000_000n,
    };

    // create a group with message disappearing settings
    const group = await client1.conversations.newGroup([client2.inboxId!], {
      messageDisappearingSettings,
    });

    // verify that the message disappearing settings are set and enabled
    expect(await group.messageDisappearingSettings()).toEqual({
      fromNs: 1n,
      inNs: 2_000_000_000n,
    });
    expect(await group.isMessageDisappearingEnabled()).toBe(true);

    // send messages to the group
    const messageId1 = await group.sendText("gm");
    const messageId2 = await group.sendText("gm2");

    // verify that the messages are sent
    expect((await group.messages()).length).toBe(3);

    // sync the messages to the other client
    await client2.conversations.sync();
    const group2 = (await client2.conversations.listGroups())[0];
    await group2.sync();

    // verify that the message disappearing settings are set and enabled
    expect(await group2.messageDisappearingSettings()).toEqual({
      fromNs: 1n,
      inNs: 2_000_000_000n,
    });
    expect(await group2.isMessageDisappearingEnabled()).toBe(true);

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
    for await (const messageId of stream) {
      count++;
      expect(messageId).toBeDefined();
      messageIds.push(messageId);
    }
    expect(count).toBe(2);
    expect(messageIds).toContain(messageId1);
    expect(messageIds).toContain(messageId2);

    // remove the message disappearing settings
    await group.removeMessageDisappearingSettings();

    // verify that the message disappearing settings are removed
    expect(await group.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });

    expect(await group.isMessageDisappearingEnabled()).toBe(false);

    // sync other group
    await group2.sync();

    // verify that the message disappearing settings are set and disabled
    expect(await group2.messageDisappearingSettings()).toEqual({
      fromNs: 0n,
      inNs: 0n,
    });
    expect(await group2.isMessageDisappearingEnabled()).toBe(false);

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
    const group = await client1.conversations.newDm(client2.inboxId!);
    expect(await group.pausedForVersion()).toBeUndefined();
  });

  it("should get hmac keys", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.newGroup([client2.inboxId!]);

    const hmacKeys = await group.getHmacKeys();
    const groupIds = Array.from(hmacKeys.keys());
    for (const groupId of groupIds) {
      expect(hmacKeys.get(groupId)?.length).toBe(3);
      expect(hmacKeys.get(groupId)?.[0].key).toBeDefined();
      expect(hmacKeys.get(groupId)?.[0].epoch).toBeDefined();
      expect(hmacKeys.get(groupId)?.[1].key).toBeDefined();
      expect(hmacKeys.get(groupId)?.[1].epoch).toBeDefined();
      expect(hmacKeys.get(groupId)?.[2].key).toBeDefined();
      expect(hmacKeys.get(groupId)?.[2].epoch).toBeDefined();
    }
  });

  it("should get debug info", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);
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

  it("should filter messages by content type", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    await group.sendText("gm");

    const messages = await group.messages();
    expect(messages.length).toBe(2);

    const filteredMessages = await group.messages({
      contentTypes: ["text"],
    });
    expect(filteredMessages.length).toBe(1);
  });

  it("should count messages with various filters", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);

    const group = await client1.conversations.newGroup([client2.inboxId!]);

    await group.sendText("text 1");
    await sleep(10);
    const timestamp1 = BigInt(Date.now() * 1_000_000);
    await sleep(10);
    await group.sendText("text 2");
    await sleep(10);
    const timestamp2 = BigInt(Date.now() * 1_000_000);
    await sleep(10);
    await group.sendText("text 3");

    expect(await group.countMessages()).toBe(4n);

    // Time filters
    expect(
      await group.countMessages({
        sentBeforeNs: timestamp1,
        contentTypes: ["text"],
      }),
    ).toBe(1n);
    expect(
      await group.countMessages({
        sentAfterNs: timestamp1,
      }),
    ).toBe(2n);
    expect(
      await group.countMessages({
        sentAfterNs: timestamp2,
        contentTypes: ["text"],
      }),
    ).toBe(1n);
    expect(
      await group.countMessages({
        sentAfterNs: timestamp1,
        sentBeforeNs: timestamp2,
      }),
    ).toBe(1n);

    // Content type filter
    expect(
      await group.countMessages({
        contentTypes: ["text"],
      }),
    ).toBe(3n);
  });

  it("should have pending removal state after requesting removal from the group", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    await client1.conversations.newGroup([client2.inboxId!]);

    await client2.conversations.sync();
    const group2 = (await client2.conversations.listGroups())[0];

    expect(await group2.isPendingRemoval()).toBe(false);
    await group2.requestRemoval();
    expect(await group2.isPendingRemoval()).toBe(true);
    expect(await group2.isActive()).toBe(true);
  });

  it("should remove a member after processing their removal request", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId!]);

    await client2.conversations.sync();
    const group2 = (await client2.conversations.listGroups())[0];

    await group2.requestRemoval();

    // messages and welcomes must be synced
    await client2.conversations.syncAll();
    await client1.conversations.syncAll();

    // wait for worker to process the removal request
    await sleep(4000);

    await group2.sync();

    expect(await group2.isActive()).toBe(false);
    expect(await group2.isPendingRemoval()).toBe(true);

    expect(await group.members()).toHaveLength(1);
    expect(await group2.members()).toHaveLength(1);
  });
});
