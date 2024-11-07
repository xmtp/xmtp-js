import { ConsentState } from "@xmtp/wasm-bindings";
import { describe, expect, it } from "vitest";
import { Conversation } from "@/Conversation";
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
    const conversations = await client2.conversations.list();
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
    const conversations = await client2.conversations.list();
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
    const conversations = await client2.conversations.list();
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
    const conversations = await client2.conversations.list();
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
    const superAdmins = await conversation.superAdmins();
    expect(superAdmins.length).toBe(1);
    expect(superAdmins).toContain(client1.inboxId);
    expect(await conversation.isAdmin(client1.inboxId!)).toBe(false);
    expect(await conversation.isAdmin(client2.inboxId!)).toBe(false);
    const admins = await conversation.admins();
    expect(admins.length).toBe(0);

    await conversation.addAdmin(client2.inboxId!);
    expect(await conversation.isAdmin(client2.inboxId!)).toBe(true);
    const admins2 = await conversation.admins();
    expect(admins2.length).toBe(1);
    expect(admins2).toContain(client2.inboxId);

    await conversation.removeAdmin(client2.inboxId!);
    expect(await conversation.isAdmin(client2.inboxId!)).toBe(false);
    const admins3 = await conversation.admins();
    expect(admins3.length).toBe(0);
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

    const superAdmins = await conversation.superAdmins();
    expect(superAdmins.length).toBe(1);
    expect(superAdmins).toContain(client1.inboxId);

    await conversation.addSuperAdmin(client2.inboxId!);
    expect(await conversation.isSuperAdmin(client2.inboxId!)).toBe(true);

    const superAdmins2 = await conversation.superAdmins();
    expect(superAdmins2.length).toBe(2);
    expect(superAdmins2).toContain(client1.inboxId);
    expect(superAdmins2).toContain(client2.inboxId);

    await conversation.removeSuperAdmin(client2.inboxId!);
    expect(await conversation.isSuperAdmin(client2.inboxId!)).toBe(false);

    const superAdmins3 = await conversation.superAdmins();
    expect(superAdmins3.length).toBe(1);
    expect(superAdmins3).toContain(client1.inboxId);
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

    const groupConvo = new Conversation(client2, group2!.id, group2);

    expect(await groupConvo.consentState()).toBe(ConsentState.Unknown);
    await groupConvo.send("gm!");
    expect(await groupConvo.consentState()).toBe(ConsentState.Allowed);

    await client3.conversations.sync();
    const dmGroup2 = await client3.conversations.getConversationById(
      dmGroup.id,
    );
    expect(dmGroup2).toBeDefined();

    const dmConvo = new Conversation(client3, dmGroup2!.id, dmGroup2);

    expect(await dmConvo.consentState()).toBe(ConsentState.Unknown);
    await dmConvo.send("gm!");
    expect(await dmConvo.consentState()).toBe(ConsentState.Allowed);
  });
});
