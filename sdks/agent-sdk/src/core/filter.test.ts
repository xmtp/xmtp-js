import {
  encodeReaction,
  encodeText,
  ReactionAction,
  ReactionSchema,
  type EnrichedReply,
  type GroupUpdated,
  type Reaction,
  type ReadReceipt,
  type RemoteAttachment,
  type TransactionReference,
  type WalletSendCalls,
} from "@xmtp/node-sdk";
import { describe, expect, it } from "vitest";
import { filter } from "@/core/filter";
import { createClient, TestCodec } from "@/util/test";

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
      if (result) {
        assertType<Reaction>(message.content);
      }
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
      if (result) {
        assertType<EnrichedReply>(message.content);
      }
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
      if (result) {
        assertType<string>(message.content);
      }
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
      if (result) {
        assertType<EnrichedReply<string>>(message.content);
      }
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

  describe("isGroupUpdate", () => {
    it("should return true for group update messages", async () => {
      const client = await createClient();
      const otherClient = await createClient();
      const group = await client.conversations.createGroup([
        otherClient.inboxId,
      ]);
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isGroupUpdate(message);
      if (result) {
        assertType<GroupUpdated>(message.content);
      }
      expect(result).toBe(true);
    });

    it("should return false for non-group update messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isGroupUpdate(message);
      expect(result).toBe(false);
    });
  });

  describe("isRemoteAttachment", () => {
    it("should return true for remote attachment messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendRemoteAttachment({
        url: "https://example.com/test.pdf",
        contentDigest: "test",
        secret: new Uint8Array([1, 2, 3]),
        salt: new Uint8Array([1, 2, 3]),
        nonce: new Uint8Array([1, 2, 3]),
        scheme: "https",
        contentLength: 100,
        filename: "test.pdf",
      });
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isRemoteAttachment(message);
      if (result) {
        assertType<RemoteAttachment>(message.content);
      }
      expect(result).toBe(true);
    });

    it("should return false for non-remote attachment messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isRemoteAttachment(message);
      expect(result).toBe(false);
    });
  });

  describe("isMarkdown", () => {
    it("should return true for markdown messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendMarkdown("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isMarkdown(message);
      if (result) {
        assertType<string>(message.content);
      }
      expect(result).toBe(true);
    });

    it("should return false for non-markdown messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isMarkdown(message);
      expect(result).toBe(false);
    });
  });

  describe("isReadReceipt", () => {
    it("should return true for read receipt messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const messageId = await group.sendReadReceipt();
      const message = client.conversations.getMessageById(messageId)!;
      const result = filter.isReadReceipt(message);
      if (result) {
        assertType<ReadReceipt>(message.content);
      }
      expect(result).toBe(true);
    });

    it("should return false for non-read receipt messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isReadReceipt(message);
      expect(result).toBe(false);
    });
  });

  describe("isTransactionReference", () => {
    it("should return true for transaction reference messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendTransactionReference({
        networkId: "1",
        reference: "1234567890",
      });
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isTransactionReference(message);
      if (result) {
        assertType<TransactionReference>(message.content);
      }
      expect(result).toBe(true);
    });

    it("should return false for non-transaction reference messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isTransactionReference(message);
      expect(result).toBe(false);
    });
  });

  describe("isWalletSendCalls", () => {
    it("should return true for wallet send calls messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendWalletSendCalls({
        version: "1.0",
        chainId: "1",
        from: "0x1234567890",
        calls: [
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
          },
        ],
      });
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isWalletSendCalls(message);
      if (result) {
        assertType<WalletSendCalls>(message.content);
      }
      expect(result).toBe(true);
    });

    it("should return false for non-wallet send calls messages", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      await group.sendText("Hello world");
      const messages = await group.messages();
      const message = messages[0]!;
      const result = filter.isWalletSendCalls(message);
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
      if (result) {
        assertType<Record<string, string>>(message.content);
      }
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
