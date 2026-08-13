import {
  contentTypeReaction,
  contentTypeRemoteAttachment,
  contentTypeReply,
  contentTypeText,
  DeliveryStatus,
  GroupMessageKind,
  ReactionAction,
  ReactionSchema,
  type DecodedMessage,
  type EnrichedReply,
  type Reaction,
  type RemoteAttachment,
} from "@xmtp/browser-sdk";
import { type ContentTypeId } from "@xmtp/content-type-primitives";
import { describe, expect, it } from "vitest";
import { isActionable, isRemoteAttachment, stringify } from "./messages";

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
      contentType: () => contentTypeText(),
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

describe("isRemoteAttachment", () => {
  it("recognizes remote static attachment messages", async () => {
    const content: RemoteAttachment = {
      contentDigest: "digest",
      contentLength: 42,
      filename: "image.png",
      nonce: new Uint8Array([1]),
      salt: new Uint8Array([2]),
      secret: new Uint8Array([3]),
      scheme: "https://",
      url: "https://example.com/image.png",
    };
    const decodedMessage = createDecodedMessage(
      content,
      await contentTypeRemoteAttachment(),
    );

    expect(isRemoteAttachment(decodedMessage)).toBe(true);
    expect(isActionable(decodedMessage)).toBe(true);
  });
});
