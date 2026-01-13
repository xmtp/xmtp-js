import {
  contentTypeReaction,
  contentTypeReply,
  contentTypeText,
  DeliveryStatus,
  GroupMessageKind,
  ReactionAction,
  ReactionSchema,
  type DecodedMessage,
  type EnrichedReply,
  type Reaction,
} from "@xmtp/browser-sdk";
import { type ContentTypeId } from "@xmtp/content-type-primitives";
import { describe, expect, it } from "vitest";
import { stringify } from "./messages";

const createDecodedMessage = <T>(
  content: T,
  contentType: ContentTypeId,
  fallback?: string,
): DecodedMessage<T> => {
  return {
    id: "test-id",
    sentAtNs: 1000n,
    kind: GroupMessageKind.Application,
    senderInstallationId: "test-installation-id",
    senderInboxId: "test-inbox-id",
    contentType,
    conversationId: "test-conversation-id",
    content,
    fallback,
    reactions: [],
    deliveryStatus: DeliveryStatus.Published,
    numReplies: 0n,
    expiresAtNs: undefined,
  } as unknown as DecodedMessage<T>;
};

describe("stringify", () => {
  it("returns plain text for text messages", async () => {
    const content = "Hello, World!";
    const textDecodedMessage = createDecodedMessage(
      content,
      await contentTypeText(),
      "fallback",
    );
    expect(stringify(textDecodedMessage)).toBe(content);
  });

  it("returns plain text for text replies", async () => {
    const textDecodedMessage = createDecodedMessage(
      "gm",
      await contentTypeText(),
      "fallback",
    );
    const content: EnrichedReply<string> = {
      referenceId: "id",
      content: "hi",
      inReplyTo: textDecodedMessage,
    };
    const replyDecodedMessage = createDecodedMessage(
      content,
      await contentTypeReply(),
      "fallback",
    );
    expect(stringify(replyDecodedMessage)).toBe(content.content);
  });

  it("returns plain text for reactions", async () => {
    const content: Reaction = {
      reference: "id",
      referenceInboxId: "inbox",
      action: ReactionAction.Added,
      content: "👍",
      schema: ReactionSchema.Unicode,
    };
    const reactionDecodedMessage = createDecodedMessage(
      content,
      await contentTypeReaction(),
      "fallback",
    );
    expect(stringify(reactionDecodedMessage)).toBe(content.content);
  });

  it("returns fallback text when the content type is unknown", () => {
    const fallback = "fallback";
    const decodedMessage = createDecodedMessage(
      {},
      {
        authorityId: "test",
        typeId: "unknown.content.type",
        versionMajor: 3,
        versionMinor: 0,
      },
      fallback,
    );
    expect(stringify(decodedMessage)).toBe(fallback);
  });
});
