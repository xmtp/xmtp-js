import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { Dm, Group, type Client, type DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, it, vi } from "vitest";
import { filter } from "@/utils/filter.js";

const mockClient = {
  inboxId: "test-client-inbox-id",
} as unknown as Client;

const dmConversation = {
  id: "direct-message",
  metadata: () =>
    Promise.resolve({
      creatorInboxId: "test-client-inbox-id",
      conversationType: "dm",
    }),
} as unknown as Dm;

Object.setPrototypeOf(dmConversation, Dm.prototype);

const createMockGroup = (
  adminInboxIds: string[] = [],
  superAdminInboxIds: string[] = [],
) => {
  const mockGroup = {
    id: "group-conversation",
    metadata: () =>
      Promise.resolve({
        creatorInboxId: "test-client-inbox-id",
        conversationType: "group",
      }),
    isAdmin: vi.fn((inboxId: string) => adminInboxIds.includes(inboxId)),
    isSuperAdmin: vi.fn((inboxId: string) =>
      superAdminInboxIds.includes(inboxId),
    ),
  };

  Object.setPrototypeOf(mockGroup, Group.prototype);

  return mockGroup as unknown as Group;
};

const createMockMessage = (overrides: Partial<DecodedMessage> = {}) =>
  ({
    senderInboxId: "my-inbox-id",
    contentType: ContentTypeText,
    content: "Test message",
    ...overrides,
  }) as DecodedMessage;

describe("Filters", () => {
  describe("fromSelf", () => {
    it("should return false for messages not from self", () => {
      const message = createMockMessage({ senderInboxId: "other-inbox-id" });
      const result = filter.fromSelf({
        message,
        client: mockClient,
      });
      expect(result).toBe(false);
    });

    it("should return true for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filter.fromSelf({
        message,
        client: mockClient,
      });
      expect(result).toBe(true);
    });
  });

  describe("isText", () => {
    it("should return true for text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeText });
      const result = filter.isText({
        message,
      });
      expect(result).toBe(true);
    });

    it("should return false for non-text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeReply });
      const result = filter.isText({
        message,
      });
      expect(result).toBe(false);
    });
  });

  describe("fromSender", () => {
    it("should return true for matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "target-sender" });
      const fromSender = filter.fromSender("target-sender");
      const result = fromSender({
        message,
      });
      expect(result).toBe(true);
    });

    it("should return false for non-matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "other-sender" });
      const fromSender = filter.fromSender("target-sender");
      const result = fromSender({
        message,
      });
      expect(result).toBe(false);
    });

    it("should return true for matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-2" });
      const fromSender = filter.fromSender([
        "sender-1",
        "sender-2",
        "sender-3",
      ]);
      const result = fromSender({
        message,
      });
      expect(result).toBe(true);
    });

    it("should return false for non-matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-4" });
      const fromSender = filter.fromSender([
        "sender-1",
        "sender-2",
        "sender-3",
      ]);
      const result = fromSender({
        message,
      });
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

      const result = await andFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(filter2).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(filter3).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
    });

    it("should return false when any filter fails", async () => {
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(false);
      const filter3 = vi.fn().mockReturnValue(true);

      const andFilter = filter.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await andFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return true for empty filter array", async () => {
      const andFilter = filter.and();
      const message = createMockMessage();

      const result = await andFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
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

      const result = await orFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
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

      const result = await orFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(filter2).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(filter3).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
    });

    it("should return false for empty filter array", async () => {
      const orFilter = filter.or();
      const message = createMockMessage();

      const result = await orFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(false);
    });
  });

  describe("not", () => {
    it("should invert filter result from true to false", async () => {
      const baseFilter = vi.fn().mockReturnValue(true);
      const notFilter = filter.not(baseFilter);
      const message = createMockMessage();

      const result = await notFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(false);
      expect(baseFilter).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
    });

    it("should invert filter result from false to true", async () => {
      const baseFilter = vi.fn().mockReturnValue(false);
      const notFilter = filter.not(baseFilter);
      const message = createMockMessage();

      const result = await notFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(true);
      expect(baseFilter).toHaveBeenCalledWith({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
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
        filter.or(filter.isText),
        filter.not(filter.fromSelf),
      );

      const result = await complexFilter({
        message,
        client: mockClient,
        conversation: dmConversation,
      });
      expect(result).toBe(true);
    });
  });

  describe("startsWith", () => {
    it("matches text messages starting with a specific string", () => {
      const message = createMockMessage({
        content: "@agent this message is for you",
      });

      const positive = filter.startsWith("@agent")({
        message,
      });
      expect(positive).toBe(true);

      const negative = filter.startsWith("@xmtp")({
        message,
      });
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

      const positive = filter.startsWith("@agent")({
        message: replyMessage,
      });
      expect(positive).toBe(true);

      const negative = filter.startsWith("@xmtp")({
        message: replyMessage,
      });
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

      const positive = filter.startsWith("👍")({
        message: reactionMessage,
      });
      expect(positive).toBe(true);

      const negative = filter.startsWith("👎")({
        message: reactionMessage,
      });
      expect(negative).toBe(false);
    });
  });

  describe("isDM", () => {
    it("recognizes direct messages", () => {
      expect(
        filter.isDM({
          conversation: dmConversation,
        }),
      ).toBe(true);
      expect(
        filter.isDM({
          conversation: createMockGroup(),
        }),
      ).toBe(false);
    });
  });

  describe("isGroup", () => {
    it("recognizes groups", () => {
      expect(
        filter.isGroup({
          conversation: createMockGroup(),
        }),
      ).toBe(true);
      expect(
        filter.isGroup({
          conversation: dmConversation,
        }),
      ).toBe(false);
    });
  });

  describe("isGroupAdmin", () => {
    it("detects when sender is a group admin", async () => {
      const adminInboxId = "admin-inbox-id";
      const message = createMockMessage({ senderInboxId: adminInboxId });
      const mockGroup = createMockGroup([adminInboxId], []);

      const result = await filter.isGroupAdmin({
        message,
        client: mockClient,
        conversation: mockGroup,
      });

      expect(result).toBe(true);
    });

    it("detects when sender is not a group admin", async () => {
      const nonAdminInboxId = "non-admin-inbox-id";
      const adminInboxId = "admin-inbox-id";
      const message = createMockMessage({ senderInboxId: nonAdminInboxId });
      const mockGroup = createMockGroup([adminInboxId], []);

      const result = await filter.isGroupAdmin({
        message,
        client: mockClient,
        conversation: mockGroup,
      });

      expect(result).toBe(false);
    });

    it("detects when conversation is not a group", async () => {
      const message = createMockMessage({ senderInboxId: "any-inbox-id" });

      const result = await filter.isGroupAdmin({
        message,
        client: mockClient,
        conversation: dmConversation,
      });

      expect(result).toBe(false);
    });
  });

  describe("isGroupSuperAdmin", () => {
    it("detects when sender is a group super admin", async () => {
      const superAdminInboxId = "super-admin-inbox-id";
      const message = createMockMessage({ senderInboxId: superAdminInboxId });
      const mockGroup = createMockGroup([], [superAdminInboxId]);

      const result = await filter.isGroupSuperAdmin({
        message,
        client: mockClient,
        conversation: mockGroup,
      });

      expect(result).toBe(true);
    });

    it("detects when sender is not a group super admin", async () => {
      const nonSuperAdminInboxId = "non-super-admin-inbox-id";
      const superAdminInboxId = "super-admin-inbox-id";
      const message = createMockMessage({
        senderInboxId: nonSuperAdminInboxId,
      });
      const mockGroup = createMockGroup([], [superAdminInboxId]);

      const result = await filter.isGroupSuperAdmin({
        message,
        client: mockClient,
        conversation: mockGroup,
      });

      expect(result).toBe(false);
    });

    it("detects when conversation is not a group", async () => {
      const message = createMockMessage({ senderInboxId: "any-inbox-id" });

      const result = await filter.isGroupSuperAdmin({
        message,
        client: mockClient,
        conversation: dmConversation,
      });

      expect(result).toBe(false);
    });

    it("detects when sender is regular admin but not super admin", async () => {
      const adminInboxId = "admin-inbox-id";
      const superAdminInboxId = "super-admin-inbox-id";
      const message = createMockMessage({ senderInboxId: adminInboxId });
      const mockGroup = createMockGroup([adminInboxId], [superAdminInboxId]);

      const result = await filter.isGroupSuperAdmin({
        message,
        client: mockClient,
        conversation: mockGroup,
      });

      expect(result).toBe(false);
    });
  });
});
