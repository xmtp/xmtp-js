import { ContentTypeText } from "@xmtp/content-type-text";
import { Client, DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, it, vi } from "vitest";
import { ContentTypeReply } from "../../../content-types/content-type-reply/dist";
import { filters } from "../src/filters/MessageFilters";

const mockClient = {
  inboxId: "test-client-inbox-id",
} as unknown as Client;

const createMockMessage = (overrides: Partial<DecodedMessage> = {}) =>
  ({
    senderInboxId: "my-inbox-id",
    contentType: { typeId: "text" },
    content: "Test message",
    ...overrides,
  }) as DecodedMessage;

describe("MessageFilters", () => {
  describe("notFromSelf", () => {
    it("should return true for messages not from self", () => {
      const message = createMockMessage({ senderInboxId: "other-inbox-id" });
      const result = filters.notFromSelf(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filters.notFromSelf(message, mockClient);
      expect(result).toBe(false);
    });

    it("should be case sensitive", () => {
      const message = createMockMessage({
        senderInboxId: "TEST-CLIENT-INBOX-ID",
      });
      const result = filters.notFromSelf(message, mockClient);
      expect(result).toBe(true);
    });
  });

  describe("fromSelf", () => {
    it("should return false for messages not from self", () => {
      const message = createMockMessage({ senderInboxId: "other-inbox-id" });
      const result = filters.fromSelf(message, mockClient);
      expect(result).toBe(false);
    });

    it("should return true for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filters.fromSelf(message, mockClient);
      expect(result).toBe(true);
    });
  });

  describe("textOnly", () => {
    it("should return true for text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeText });
      const result = filters.textOnly(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for non-text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeReply });
      const result = filters.textOnly(message, mockClient);
      expect(result).toBe(false);
    });
  });

  describe("fromSender", () => {
    it("should return true for matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "target-sender" });
      const filter = filters.fromSender("target-sender");
      const result = filter(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for non-matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "other-sender" });
      const filter = filters.fromSender("target-sender");
      const result = filter(message, mockClient);
      expect(result).toBe(false);
    });

    it("should return true for matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-2" });
      const filter = filters.fromSender(["sender-1", "sender-2", "sender-3"]);
      const result = filter(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for non-matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-4" });
      const filter = filters.fromSender(["sender-1", "sender-2", "sender-3"]);
      const result = filter(message, mockClient);
      expect(result).toBe(false);
    });
  });

  describe("and", () => {
    it("should return true when all filters pass", async () => {
      const filter1 = vi.fn().mockResolvedValue(true);
      const filter2 = vi.fn().mockResolvedValue(true);
      const filter3 = vi.fn().mockResolvedValue(true);

      const andFilter = filters.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await andFilter(message, mockClient);
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalledWith(message, mockClient);
      expect(filter2).toHaveBeenCalledWith(message, mockClient);
      expect(filter3).toHaveBeenCalledWith(message, mockClient);
    });

    it("should return false when any filter fails", async () => {
      const filter1 = vi.fn().mockResolvedValue(true);
      const filter2 = vi.fn().mockResolvedValue(false);
      const filter3 = vi.fn().mockResolvedValue(true);

      const andFilter = filters.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await andFilter(message, mockClient);
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return true for empty filter array", async () => {
      const andFilter = filters.and();
      const message = createMockMessage();

      const result = await andFilter(message, mockClient);
      expect(result).toBe(true);
    });
  });

  describe("or", () => {
    it("should return true when any filter passes", async () => {
      const filter1 = vi.fn().mockResolvedValue(false);
      const filter2 = vi.fn().mockResolvedValue(true);
      const filter3 = vi.fn().mockResolvedValue(false);

      const orFilter = filters.or(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await orFilter(message, mockClient);
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return false when all filters fail", async () => {
      const filter1 = vi.fn().mockResolvedValue(false);
      const filter2 = vi.fn().mockResolvedValue(false);
      const filter3 = vi.fn().mockResolvedValue(false);

      const orFilter = filters.or(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = await orFilter(message, mockClient);
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalledWith(message, mockClient);
      expect(filter2).toHaveBeenCalledWith(message, mockClient);
      expect(filter3).toHaveBeenCalledWith(message, mockClient);
    });

    it("should return false for empty filter array", async () => {
      const orFilter = filters.or();
      const message = createMockMessage();

      const result = await orFilter(message, mockClient);
      expect(result).toBe(false);
    });
  });

  describe("not", () => {
    it("should invert filter result from true to false", async () => {
      const baseFilter = vi.fn().mockResolvedValue(true);
      const notFilter = filters.not(baseFilter);
      const message = createMockMessage();

      const result = await notFilter(message, mockClient);
      expect(result).toBe(false);
      expect(baseFilter).toHaveBeenCalledWith(message, mockClient);
    });

    it("should invert filter result from false to true", async () => {
      const baseFilter = vi.fn().mockResolvedValue(false);
      const notFilter = filters.not(baseFilter);
      const message = createMockMessage();

      const result = await notFilter(message, mockClient);
      expect(result).toBe(true);
      expect(baseFilter).toHaveBeenCalledWith(message, mockClient);
    });
  });

  describe("complex combinations", () => {
    it("should handle nested combinations correctly", async () => {
      const message = createMockMessage({
        senderInboxId: "target-sender",
        contentType: ContentTypeText,
      });

      const complexFilter = filters.and(
        filters.fromSender("target-sender"),
        filters.or(filters.textOnly),
        filters.not(filters.fromSelf),
      );

      const result = await complexFilter(message, mockClient);
      expect(result).toBe(true);
    });
  });
});
