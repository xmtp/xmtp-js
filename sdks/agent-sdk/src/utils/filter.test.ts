import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, it, vi } from "vitest";
import { filter } from "@/utils/filter";

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
      const result = filter.notFromSelf(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for messages from self", () => {
      const message = createMockMessage({
        senderInboxId: "test-client-inbox-id",
      });
      const result = filter.notFromSelf(message, mockClient);
      expect(result).toBe(false);
    });

    it("should be case sensitive", () => {
      const message = createMockMessage({
        senderInboxId: "TEST-CLIENT-INBOX-ID",
      });
      const result = filter.notFromSelf(message, mockClient);
      expect(result).toBe(true);
    });
  });

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

  describe("textOnly", () => {
    it("should return true for text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeText });
      const result = filter.textOnly(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for non-text messages", () => {
      const message = createMockMessage({ contentType: ContentTypeReply });
      const result = filter.textOnly(message, mockClient);
      expect(result).toBe(false);
    });
  });

  describe("fromSender", () => {
    it("should return true for matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "target-sender" });
      const fromSender = filter.fromSender("target-sender");
      const result = fromSender(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for non-matching single sender", () => {
      const message = createMockMessage({ senderInboxId: "other-sender" });
      const fromSender = filter.fromSender("target-sender");
      const result = fromSender(message, mockClient);
      expect(result).toBe(false);
    });

    it("should return true for matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-2" });
      const fromSender = filter.fromSender([
        "sender-1",
        "sender-2",
        "sender-3",
      ]);
      const result = fromSender(message, mockClient);
      expect(result).toBe(true);
    });

    it("should return false for non-matching sender in array", () => {
      const message = createMockMessage({ senderInboxId: "sender-4" });
      const fromSender = filter.fromSender([
        "sender-1",
        "sender-2",
        "sender-3",
      ]);
      const result = fromSender(message, mockClient);
      expect(result).toBe(false);
    });
  });

  describe("and", () => {
    it("should return true when all filters pass", () => {
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(true);
      const filter3 = vi.fn().mockReturnValue(true);

      const andFilter = filter.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = andFilter(message, mockClient);
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalledWith(message, mockClient);
      expect(filter2).toHaveBeenCalledWith(message, mockClient);
      expect(filter3).toHaveBeenCalledWith(message, mockClient);
    });

    it("should return false when any filter fails", () => {
      const filter1 = vi.fn().mockReturnValue(true);
      const filter2 = vi.fn().mockReturnValue(false);
      const filter3 = vi.fn().mockReturnValue(true);

      const andFilter = filter.and(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = andFilter(message, mockClient);
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return true for empty filter array", () => {
      const andFilter = filter.and();
      const message = createMockMessage();

      const result = andFilter(message, mockClient);
      expect(result).toBe(true);
    });
  });

  describe("or", () => {
    it("should return true when any filter passes", () => {
      const filter1 = vi.fn().mockReturnValue(false);
      const filter2 = vi.fn().mockReturnValue(true);
      const filter3 = vi.fn().mockReturnValue(false);

      const orFilter = filter.or(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = orFilter(message, mockClient);
      expect(result).toBe(true);
      expect(filter1).toHaveBeenCalled();
      expect(filter2).toHaveBeenCalled();
      // filter3 should not be called due to short-circuit evaluation
      expect(filter3).not.toHaveBeenCalled();
    });

    it("should return false when all filters fail", () => {
      const filter1 = vi.fn().mockReturnValue(false);
      const filter2 = vi.fn().mockReturnValue(false);
      const filter3 = vi.fn().mockReturnValue(false);

      const orFilter = filter.or(filter1, filter2, filter3);
      const message = createMockMessage();

      const result = orFilter(message, mockClient);
      expect(result).toBe(false);
      expect(filter1).toHaveBeenCalledWith(message, mockClient);
      expect(filter2).toHaveBeenCalledWith(message, mockClient);
      expect(filter3).toHaveBeenCalledWith(message, mockClient);
    });

    it("should return false for empty filter array", () => {
      const orFilter = filter.or();
      const message = createMockMessage();

      const result = orFilter(message, mockClient);
      expect(result).toBe(false);
    });
  });

  describe("not", () => {
    it("should invert filter result from true to false", () => {
      const baseFilter = vi.fn().mockReturnValue(true);
      const notFilter = filter.not(baseFilter);
      const message = createMockMessage();

      const result = notFilter(message, mockClient);
      expect(result).toBe(false);
      expect(baseFilter).toHaveBeenCalledWith(message, mockClient);
    });

    it("should invert filter result from false to true", () => {
      const baseFilter = vi.fn().mockReturnValue(false);
      const notFilter = filter.not(baseFilter);
      const message = createMockMessage();

      const result = notFilter(message, mockClient);
      expect(result).toBe(true);
      expect(baseFilter).toHaveBeenCalledWith(message, mockClient);
    });
  });

  describe("complex combinations", () => {
    it("should handle nested combinations correctly", () => {
      const message = createMockMessage({
        senderInboxId: "target-sender",
        contentType: ContentTypeText,
      });

      const complexFilter = filter.and(
        filter.fromSender("target-sender"),
        filter.or(filter.textOnly),
        filter.not(filter.fromSelf),
      );

      const result = complexFilter(message, mockClient);
      expect(result).toBe(true);
    });
  });
});
