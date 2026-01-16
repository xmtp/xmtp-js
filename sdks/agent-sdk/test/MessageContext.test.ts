import {
  encodeText,
  type DecodedMessage,
  type EnrichedReply,
} from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it } from "vitest";
import { MessageContext } from "@/core/MessageContext";
import { createClient } from "@test/helpers";

describe("MessageContext", () => {
  describe("usesCodec", () => {
    it("should properly type the content when using reply as input", async () => {
      const client = await createClient();
      const group = await client.conversations.createGroup([]);
      const messageId = await group.sendReply({
        reference: "message-id",
        referenceInboxId: "sender-inbox-id",
        content: encodeText("This is a reply"),
      });
      const replyMessage = client.conversations.getMessageById(
        messageId,
      )! as DecodedMessage<EnrichedReply<string>>;
      const messageContext = new MessageContext({
        message: replyMessage,
        conversation: group,
        client,
      });

      const typedContext = messageContext as MessageContext<
        EnrichedReply<string>
      >;
      expectTypeOf(typedContext.message.content).toEqualTypeOf<
        EnrichedReply<string>
      >();
      const { content } = typedContext.message;
      expect(content.content).toBe(replyMessage.content?.content);
    });
  });
});
