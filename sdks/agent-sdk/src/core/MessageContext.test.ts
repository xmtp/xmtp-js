import {
  contentTypeReply,
  contentTypeText,
  Dm,
  type Reply,
} from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createMockMessage,
  makeClient,
  type CurrentClientTypes,
} from "@/util/TestUtil.js";
import { MessageContext } from "./MessageContext.js";

describe("MessageContext", () => {
  const mockClient = makeClient();

  describe("usesCodec", () => {
    const mockDm = Object.create(Dm.prototype) as Dm;

    it("should properly type the content when using ReplyCodec as input", () => {
      const replyMessage = createMockMessage<Reply>({
        id: "reply-message-id",
        senderInboxId: "other-inbox-id",
        contentType: contentTypeReply(),
        content: {
          content: "This is a reply",
          referenceId: "original-message-id",
          inReplyTo: createMockMessage({
            id: "original-message-id",
            senderInboxId: "other-inbox-id",
            contentType: contentTypeText(),
            content: "This is a text message",
          }),
        },
      });

      const messageContext = new MessageContext<CurrentClientTypes>({
        message: replyMessage,
        conversation: mockDm,
        client: mockClient,
      });

      const typedContext = messageContext as MessageContext<Reply>;
      expectTypeOf(typedContext.message.content).toEqualTypeOf<Reply>();
      const { content } = typedContext.message;
      expect(content.content).toBe(replyMessage.content.content);
    });
  });
});
