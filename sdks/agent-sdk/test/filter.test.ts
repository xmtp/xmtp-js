import {
  encodeReaction,
  encodeText,
  ReactionAction,
  ReactionSchema,
} from "@xmtp/node-sdk";
import { describe, expect, it } from "vitest";
import { filter } from "@/core/filter";
import { createClient, TestCodec } from "@test/helpers";

describe("Filters", () => {
  describe("fromSelf", () => {
    it("should return false for messages not from self", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const group = await client.conversations.createGroup([
        otherClient.inboxId,
      ]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.fromSelf(message, otherClient);
      expect(result).toBe(false);
    });

    it("should return true for messages from self", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.fromSelf(message, client);
      expect(result).toBe(true);
    });
  });

  describe("hasContent", () => {
    it("should return true for messages with defined content", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.hasContent(message);
      expect(result).toBe(true);
    });

    it("should return false for messages with no content", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const testCodec = new TestCodec();
      await group.send(testCodec.encode({ test: "test" }));
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.hasContent(message);
      expect(result).toBe(false);
    });
  });

  describe("isDM", () => {
    it("should return true for DM conversations", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const dm = await client.conversations.createDm(otherClient.inboxId);
      const result = filter.isDM(dm);
      expect(result).toBe(true);
    });

    it("should return false for group conversations", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const result = filter.isDM(group);
      expect(result).toBe(false);
    });
  });

  describe("isGroup", () => {
    it("should return true for group conversations", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const result = filter.isGroup(group);
      expect(result).toBe(true);
    });

    it("should return false for DM conversations", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const dm = await client.conversations.createDm(otherClient.inboxId);
      const result = filter.isGroup(dm);
      expect(result).toBe(false);
    });
  });

  describe("isGroupAdmin", () => {
    it("should return true when sender is a group admin", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const g = await client.conversations.createGroup([otherClient.inboxId]);
      await g.addAdmin(otherClient.inboxId);
      await otherClient.conversations.sync();
      const group = otherClient.conversations.listGroups()[0]!;
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[2]!;
      const result = filter.isGroupAdmin(group, message);
      expect(result).toBe(true);
    });

    it("should return false when sender is not a group admin", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      await client.conversations.createGroup([otherClient.inboxId]);
      await otherClient.conversations.sync();
      const group = otherClient.conversations.listGroups()[0]!;
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isGroupAdmin(group, message);
      expect(result).toBe(false);
    });

    it("should return false when conversation is not a group", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const dm = await client.conversations.createDm(otherClient.inboxId);
      const messages = await dm.messages();
      const message = messages[0]!;
      const result = filter.isGroupAdmin(dm, message);
      expect(result).toBe(false);
    });
  });

  describe("isGroupSuperAdmin", () => {
    it("should return true when sender is a group super admin", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isGroupSuperAdmin(group, message);
      expect(result).toBe(true);
    });

    it("should return false when sender is not a group super admin", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      await client.conversations.createGroup([otherClient.inboxId]);
      await otherClient.conversations.sync();
      const group = otherClient.conversations.listGroups()[0]!;
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[1]!;
      const result = filter.isGroupSuperAdmin(group, message);
      expect(result).toBe(false);
    });

    it("should return false when conversation is not a group", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const dm = await client.conversations.createDm(otherClient.inboxId);
      const messages = await dm.messages();
      const message = messages[0]!;
      const result = filter.isGroupSuperAdmin(dm, message);
      expect(result).toBe(false);
    });

    it("should return false when sender is regular admin but not super admin", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const g = await client.conversations.createGroup([otherClient.inboxId]);
      await g.addAdmin(otherClient.inboxId);
      await otherClient.conversations.sync();
      const group = otherClient.conversations.listGroups()[0]!;
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[2]!;
      const result = filter.isGroupSuperAdmin(group, message);
      expect(result).toBe(false);
    });
  });

  describe("isReaction", () => {
    it("should return true for reaction messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const messageId = await group.sendReaction({
        action: ReactionAction.Added,
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        schema: ReactionSchema.Unicode,
        content: "👍",
      });
      const message = client.conversations.getMessageById(messageId)!;
      const result = filter.isReaction(message);
      expect(result).toBe(true);
    });

    it("should return false for non-reaction messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isReaction(message);
      expect(result).toBe(false);
    });
  });

  describe("isReply", () => {
    it("should return true for reply messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendReply({
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        content: encodeText("This is a reply"),
      });
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isReply(message);
      expect(result).toBe(true);
    });

    it("should return false for non-reply messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isReply(message);
      expect(result).toBe(false);
    });
  });

  describe("isText", () => {
    it("should return true for text messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isText(message);
      expect(result).toBe(true);
    });

    it("should return false for non-text messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const messageId = await group.sendReaction({
        action: ReactionAction.Added,
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        schema: ReactionSchema.Unicode,
        content: "👍",
      });
      const message = client.conversations.getMessageById(messageId)!;
      const result = filter.isText(message);
      expect(result).toBe(false);
    });
  });

  describe("isTextReply", () => {
    it("should return true for text reply messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendReply({
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        content: encodeText("This is a reply"),
      });
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isTextReply(message);
      expect(result).toBe(true);
    });

    it("should return false for non-reply messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isTextReply(message);
      expect(result).toBe(false);
    });

    it("should return false for non-text reply messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendReply({
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        content: encodeReaction({
          action: ReactionAction.Added,
          reference: "ref",
          referenceInboxId: "id",
          schema: ReactionSchema.Unicode,
          content: "👍",
        }),
      });
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isTextReply(message);
      expect(result).toBe(false);
    });
  });

  describe("usesCodec", () => {
    it("should return true for messages using a custom codec", async () => {
      const testCodec = new TestCodec();
      const client = await createClient({
        codecs: [testCodec],
      });
      const group = await client.conversations.createGroup([]);
      const messageId = await group.send(testCodec.encode({ test: "test" }));
      const message = client.conversations.getMessageById(messageId)!;
      const result = filter.usesCodec(message, TestCodec);
      expect(result).toBe(true);
    });

    it("should return false for messages using a different codec", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const messageId = await group.sendText("Hello world");
      const message = client.conversations.getMessageById(messageId)!;
      const result = filter.usesCodec(message, TestCodec);
      expect(result).toBe(false);
    });
  });
});
