import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, it, vi } from "vitest";
import { filter } from "@/utils/filter.js";

const dmConversation = {
  id: "convo-dm",
  metadata: Promise.resolve({
    creatorInboxId: "test-client-inbox-id",
    conversationType: "dm",
  }),
} as unknown as Conversation;

const groupConversation = {
  id: "convo-group",
  metadata: Promise.resolve({
    creatorInboxId: "test-client-inbox-id",
    conversationType: "group",
  }),
} as unknown as Conversation;

const mockClient = {
  inboxId: "test-client-inbox-id",
} as unknown as Client;

const createMockMessage = (overrides: Partial<DecodedMessage> = {}) =>
  ({
    senderInboxId: "my-inbox-id",
    contentType: ContentTypeText,
    content: "Test message",
    ...overrides,
  }) as DecodedMessage;

describe("MessageFilters", () => {
  describe("notFromSelf", () => {
    it("should return true for messages not from self", () => {
      const message = createMockMessage({ senderInboxId: "other-inbox-id" });
      const result = filter.notFromSelf(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });

    it("should return false for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filter.notFromSelf(message, mockClient, dmConversation);
      expect(result).toBe(false);
    });

    it("should be case sensitive", () => {
      const message = createMockMessage({
        senderInboxId: "TEST-CLIENT-INBOX-ID",
      });
      const result = filter.notFromSelf(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });
  });

  describe("fromSelf", () => {
    it("should return false for messages not from self", () => {
      const message = createMockMessage({ senderInboxId: "other-inbox-id" });
      const result = filter.fromSelf(message, mockClient, dmConversation);
      expect(result).toBe(false);
    });

    it("should return true for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filter.fromSelf(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });
  });

  describe("textOnly", () => {
    it("should return true for text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeText });
      const result = filter.textOnly(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });

    it("should return false for non-text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeReply });
      const result = filter.textOnly(message, mockClient, dmConversation);
      expect(result).toBe(false);
    });
  });

  describe("fromSender", () => {
    it("should return true for matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "target-sender" });
      const fromSender = filter.fromSender("target-sender");
      const result = fromSender(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });

    it("should return false for non-matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "other-sender" });
      const fromSender = filter.fromSender("target-sender");
      const result = fromSender(message, mockClient, dmConversation);
      expect(result).toBe(false);
    });

    it("should return true for matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-2" });
      const fromSender = filter.fromSender([
        "sender-1",
        "sender-2",
        "sender-3",
      ]);
      const result = fromSender(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });

    it("should return false for non-matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-4" });
      const fromSender = filter.fromSender([
        "sender-1",
        "sender-2",
        "sender-3",
      ]);
      const result = fromSender(message, mockClient, dmConversation);
      expect(result).toBe(false);
    });
  });

  describe("and", () => {
    it("should return true when all filters pass", async () => {
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(true);
      const filter3 = vi.fn().mockReturnValue(true);

      const andFilter = filter.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await andFilter(message, mockClient, dmConversation);
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalledWith(message, mockClient, dmConversation);
      expect(filter2).toHaveBeenCalledWith(message, mockClient, dmConversation);
      expect(filter3).toHaveBeenCalledWith(message, mockClient, dmConversation);
    });

    it("should return false when any filter fails", async () => {
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(false);
      const filter3 = vi.fn().mockReturnValue(true);

      const andFilter = filter.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await andFilter(message, mockClient, dmConversation);
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return true for empty filter array", async () => {
      const andFilter = filter.and();
      const message = createMockMessage();

      const result = await andFilter(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });
  });

  describe("or", () => {
    it("should return true when any filter passes", async () => {
      const filter1 = vi.fn().mockReturnValue(false);
      const filter2 = vi.fn().mockReturnValue(true);
      const filter3 = vi.fn().mockReturnValue(false);

      const orFilter = filter.or(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await orFilter(message, mockClient, dmConversation);
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return false when all filters fail", async () => {
      const filter1 = vi.fn().mockReturnValue(false);
      const filter2 = vi.fn().mockReturnValue(false);
      const filter3 = vi.fn().mockReturnValue(false);

      const orFilter = filter.or(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await orFilter(message, mockClient, dmConversation);
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalledWith(message, mockClient, dmConversation);
      expect(filter2).toHaveBeenCalledWith(message, mockClient, dmConversation);
      expect(filter3).toHaveBeenCalledWith(message, mockClient, dmConversation);
    });

    it("should return false for empty filter array", async () => {
      const orFilter = filter.or();
      const message = createMockMessage();

      const result = await orFilter(message, mockClient, dmConversation);
      expect(result).toBe(false);
    });
  });

  describe("not", () => {
    it("should invert filter result from true to false", async () => {
      const baseFilter = vi.fn().mockReturnValue(true);
      const notFilter = filter.not(baseFilter);
      const message = createMockMessage();

      const result = await notFilter(message, mockClient, dmConversation);
      expect(result).toBe(false);
      expect(baseFilter).toHaveBeenCalledWith(
        message,
        mockClient,
        dmConversation,
      );
    });

    it("should invert filter result from false to true", async () => {
      const baseFilter = vi.fn().mockReturnValue(false);
      const notFilter = filter.not(baseFilter);
      const message = createMockMessage();

      const result = await notFilter(message, mockClient, dmConversation);
      expect(result).toBe(true);
      expect(baseFilter).toHaveBeenCalledWith(
        message,
        mockClient,
        dmConversation,
      );
    });
  });

  describe("complex combinations", () => {
    it("should handle nested combinations correctly", async () => {
      const message = createMockMessage({
        senderInboxId: "target-sender",
        contentType: ContentTypeText,
      });

      const complexFilter = filter.and(
        filter.fromSender("target-sender"),
        filter.or(filter.textOnly),
        filter.not(filter.fromSelf),
      );

      const result = await complexFilter(message, mockClient, dmConversation);
      expect(result).toBe(true);
    });
  });

  describe("startsWith", () => {
    it("matches text messages starting with a specific string", () => {
      const message = createMockMessage({
        content: "@agent this message is for you",
      });

      const positive = filter.startsWith("@agent")(
        message,
        mockClient,
        dmConversation,
      );
      expect(positive).toBe(true);

      const negative = filter.startsWith("@xmtp")(
        message,
        mockClient,
        dmConversation,
      );
      expect(negative).toBe(false);
    });

    it("matches replies starting with a specific string", () => {
      const message = createMockMessage({
        content: "How can I help you?",
      });

      const reply: Reply = {
        reference: message.id,
        referenceInboxId: message.senderInboxId,
        contentType: ContentTypeText,
        content: "@agent what's the weather today?",
      };

      const replyMessage = createMockMessage({
        content: reply,
        contentType: ContentTypeReply,
      });

      const positive = filter.startsWith("@agent")(
        replyMessage,
        mockClient,
        dmConversation,
      );
      expect(positive).toBe(true);

      const negative = filter.startsWith("@xmtp")(
        replyMessage,
        mockClient,
        dmConversation,
      );
      expect(negative).toBe(false);
    });

    it("works with emoji reactions", () => {
      const message = createMockMessage({
        content: "The new documentation is much more helpful",
      });

      const reaction: Reaction = {
        action: "added",
        reference: message.id,
        referenceInboxId: message.senderInboxId,
        schema: "unicode",
        content: "👍",
      };

      const reactionMessage = createMockMessage({
        content: reaction,
        contentType: ContentTypeReaction,
      });

      const positive = filter.startsWith("👍")(
        reactionMessage,
        mockClient,
        dmConversation,
      );
      expect(positive).toBe(true);

      const negative = filter.startsWith("👎")(
        reactionMessage,
        mockClient,
        dmConversation,
      );
      expect(negative).toBe(false);
    });
  });

  describe("conversation type filters", () => {
    it("isDM true for dm, false for group", async () => {
      const message = createMockMessage();
      await expect(
        filter.isDM(message, mockClient, dmConversation),
      ).resolves.toBe(true);
      await expect(
        filter.isDM(message, mockClient, groupConversation),
      ).resolves.toBe(false);
    });

    it("isGroup true for group, false for dm", async () => {
      const message = createMockMessage();
      await expect(
        filter.isGroup(message, mockClient, groupConversation),
      ).resolves.toBe(true);
      await expect(
        filter.isGroup(message, mockClient, dmConversation),
      ).resolves.toBe(false);
    });
  });
});
