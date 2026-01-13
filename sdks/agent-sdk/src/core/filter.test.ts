import {
  contentTypeReaction,
  contentTypeReply,
  contentTypeText,
  Dm,
  encodeReaction,
  encodeText,
  Group,
  ReactionAction,
  ReactionSchema,
  type Client,
  type DecodedMessage,
  type Reaction,
} from "@xmtp/node-sdk";
import { describe, expect, it, vi } from "vitest";
import { filter } from "@/core/filter.js";

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
    contentType: contentTypeText(),
    content: "Test message",
    ...overrides,
  }) as DecodedMessage;

describe("Filters", () => {
  describe("fromSelf", () => {
    it("should return false for messages not from self", () => {
      const message = createMockMessage({ senderInboxId: "other-inbox-id" });
      const result = filter.fromSelf(message, mockClient);
      expect(result).toBe(false);
    });

    it("should return true for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filter.fromSelf(message, mockClient);
      expect(result).toBe(true);
    });
  });

  describe("hasContent", () => {
    it("should return true for messages with defined content", () => {
      const message = createMockMessage({ content: "Hello world" });
      const result = filter.hasContent(message);
      expect(result).toBe(true);
    });

    it("should return false for messages with null content", () => {
      const message = createMockMessage({ content: null });
      const result = filter.hasContent(message);
      expect(result).toBe(false);
    });

    it("should return false for messages with undefined content", () => {
      const message = createMockMessage({ content: undefined });
      const result = filter.hasContent(message);
      expect(result).toBe(false);
    });
  });

  describe("isDM", () => {
    it("should return true for DM conversations", () => {
      const result = filter.isDM(dmConversation);
      expect(result).toBe(true);
    });

    it("should return false for group conversations", () => {
      const groupConversation = createMockGroup();
      const result = filter.isDM(groupConversation);
      expect(result).toBe(false);
    });
  });

  describe("isGroup", () => {
    it("should return true for group conversations", () => {
      const groupConversation = createMockGroup();
      const result = filter.isGroup(groupConversation);
      expect(result).toBe(true);
    });

    it("should return false for DM conversations", () => {
      const result = filter.isGroup(dmConversation);
      expect(result).toBe(false);
    });
  });

  describe("isGroupAdmin", () => {
    it("should return true when sender is a group admin", () => {
      const adminInboxId = "admin-inbox-id";
      const message = createMockMessage({ senderInboxId: adminInboxId });
      const mockGroup = createMockGroup([adminInboxId], []);

      const result = filter.isGroupAdmin(mockGroup, message);
      expect(result).toBe(true);
    });

    it("should return false when sender is not a group admin", () => {
      const nonAdminInboxId = "non-admin-inbox-id";
      const adminInboxId = "admin-inbox-id";
      const message = createMockMessage({ senderInboxId: nonAdminInboxId });
      const mockGroup = createMockGroup([adminInboxId], []);

      const result = filter.isGroupAdmin(mockGroup, message);
      expect(result).toBe(false);
    });

    it("should return false when conversation is not a group", () => {
      const message = createMockMessage({ senderInboxId: "any-inbox-id" });
      const result = filter.isGroupAdmin(dmConversation, message);
      expect(result).toBe(false);
    });
  });

  describe("isGroupSuperAdmin", () => {
    it("should return true when sender is a group super admin", () => {
      const superAdminInboxId = "super-admin-inbox-id";
      const message = createMockMessage({ senderInboxId: superAdminInboxId });
      const mockGroup = createMockGroup([], [superAdminInboxId]);

      const result = filter.isGroupSuperAdmin(mockGroup, message);
      expect(result).toBe(true);
    });

    it("should return false when sender is not a group super admin", () => {
      const nonSuperAdminInboxId = "non-super-admin-inbox-id";
      const superAdminInboxId = "super-admin-inbox-id";
      const message = createMockMessage({
        senderInboxId: nonSuperAdminInboxId,
      });
      const mockGroup = createMockGroup([], [superAdminInboxId]);

      const result = filter.isGroupSuperAdmin(mockGroup, message);
      expect(result).toBe(false);
    });

    it("should return false when conversation is not a group", () => {
      const message = createMockMessage({ senderInboxId: "any-inbox-id" });
      const result = filter.isGroupSuperAdmin(dmConversation, message);
      expect(result).toBe(false);
    });

    it("should return false when sender is regular admin but not super admin", () => {
      const adminInboxId = "admin-inbox-id";
      const superAdminInboxId = "super-admin-inbox-id";
      const message = createMockMessage({ senderInboxId: adminInboxId });
      const mockGroup = createMockGroup([adminInboxId], [superAdminInboxId]);

      const result = filter.isGroupSuperAdmin(mockGroup, message);
      expect(result).toBe(false);
    });
  });

  describe("isReaction", () => {
    it("should return true for reaction messages", () => {
      const reaction: Reaction = {
        action: ReactionAction.Added,
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        schema: ReactionSchema.Unicode,
        content: "👍",
      };

      const message = createMockMessage({
        content: reaction,
        contentType: contentTypeReaction(),
      });

      const result = filter.isReaction(message);
      expect(result).toBe(true);
    });

    it("should return false for non-reaction messages", () => {
      const message = createMockMessage({ contentType: contentTypeText() });
      const result = filter.isReaction(message);
      expect(result).toBe(false);
    });
  });

  describe("isReply", () => {
    it("should return true for reply messages", () => {
      const message = createMockMessage({
        content: {
          reference: "message-id",
          referenceInboxId: "sender-inbox-id",
          content: encodeText("This is a reply"),
        },
        contentType: contentTypeReply(),
      });

      const result = filter.isReply(message);
      expect(result).toBe(true);
    });

    it("should return false for non-reply messages", () => {
      const message = createMockMessage({ contentType: contentTypeText() });
      const result = filter.isReply(message);
      expect(result).toBe(false);
    });
  });

  describe("isText", () => {
    it("should return true for text messages", () => {
      const message = createMockMessage({ contentType: contentTypeText() });
      const result = filter.isText(message);
      expect(result).toBe(true);
    });

    it("should return false for non-text messages", () => {
      const message = createMockMessage({ contentType: contentTypeReply() });
      const result = filter.isText(message);
      expect(result).toBe(false);
    });
  });

  describe("isTextReply", () => {
    it("should return true for text reply messages", () => {
      const message = createMockMessage({
        content: {
          reference: "message-id",
          referenceInboxId: "sender-inbox-id",
          content: "string",
        },
        contentType: contentTypeReply(),
      });

      const result = filter.isTextReply(message);
      expect(result).toBe(true);
    });

    it("should return false for non-reply messages", () => {
      const message = createMockMessage({ contentType: contentTypeText() });
      const result = filter.isTextReply(message);
      expect(result).toBe(false);
    });

    it("should return false for non-text reply messages", () => {
      const message = createMockMessage({
        content: {
          reference: "message-id",
          referenceInboxId: "sender-inbox-id",
          content: encodeReaction({
            action: ReactionAction.Added,
            reference: "ref",
            referenceInboxId: "id",
            schema: ReactionSchema.Unicode,
            content: "👍",
          }),
        },
        contentType: contentTypeReply(),
      });

      const result = filter.isTextReply(message);
      expect(result).toBe(false);
    });
  });
});
