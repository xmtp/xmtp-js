import {
  ContentTypeReply,
  ReplyCodec,
  type Reply,
} from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import { Dm } from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createMockMessage,
  mockClient,
  type CurrentClientTypes,
} from "@/utils/TestUtil.js";
import { MessageContext } from "./MessageContext.js";

describe("MessageContext", () => {
  describe("usesCodec", () => {
    const mockDm = Object.create(Dm.prototype) as Dm;

    it("should properly type the content when using ReplyCodec as input", () => {
      const replyMessage = createMockMessage<Reply>({
        id: "reply-message-id",
        senderInboxId: "other-inbox-id",
        contentType: ContentTypeReply,
        content: {
          content: "This is a reply",
          reference: "original-message-id",
          referenceInboxId: "original-sender-inbox-id",
          contentType: ContentTypeText,
        },
      });

      const messageContext = new MessageContext<CurrentClientTypes>({
        message: replyMessage,
        conversation: mockDm,
        client: mockClient,
      });

      expect(messageContext.usesCodec(ReplyCodec)).toBe(true);
      const typedContext = messageContext as MessageContext<Reply>;
      expectTypeOf(typedContext.message.content).toEqualTypeOf<Reply>();
      const { content } = typedContext.message;
      expect(content.content).toBe(replyMessage.content.content);
    });

    it("should return false for ReplyCodec when message is not a reply", () => {
      const textMessage = createMockMessage({
        id: "text-message-id",
        senderInboxId: "sender-inbox-id",
        contentType: ContentTypeText,
        content: "This is just a regular text message",
      });

      const messageContext = new MessageContext<CurrentClientTypes>({
        message: textMessage,
        conversation: mockDm,
        client: mockClient,
      });

      const isReplyCodec = messageContext.usesCodec(ReplyCodec);
      expect(isReplyCodec).toBe(false);
    });
  });
});
