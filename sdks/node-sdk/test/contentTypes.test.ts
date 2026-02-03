import { contentTypeToString } from "@xmtp/content-type-primitives";
import {
  ActionStyle,
  contentTypeActions,
  contentTypeAttachment,
  contentTypeGroupUpdated,
  contentTypeIntent,
  contentTypeMarkdown,
  contentTypeMultiRemoteAttachment,
  contentTypeReaction,
  contentTypeReadReceipt,
  contentTypeRemoteAttachment,
  contentTypeReply,
  contentTypeText,
  contentTypeTransactionReference,
  contentTypeWalletSendCalls,
  decryptAttachment,
  encodeAttachment,
  encodeText,
  encryptAttachment,
  MetadataField,
  metadataFieldName,
  ReactionAction,
  ReactionSchema,
  type Actions,
  type Attachment,
  type GroupUpdated,
  type Intent,
  type MultiRemoteAttachment,
  type Reaction,
  type RemoteAttachment,
  type TransactionReference,
  type WalletSendCalls,
  type Reply as XmtpReply,
} from "@xmtp/node-bindings";
import { describe, expect, expectTypeOf, it, type Mock } from "vitest";
import type { DecodedMessage } from "@/DecodedMessage";
import type { EnrichedReply } from "@/types";
import {
  isActions,
  isAttachment,
  isGroupUpdated,
  isIntent,
  isMarkdown,
  isMultiRemoteAttachment,
  isReaction,
  isReadReceipt,
  isRemoteAttachment,
  isReply,
  isText,
  isTextReply,
  isTransactionReference,
  isWalletSendCalls,
} from "@/utils/messages";
import {
  createRegisteredClient,
  createSigner,
  DecodeFailureCodec,
  TestCodec,
} from "@test/helpers";

describe("Content types", () => {
  it("should send and receive text content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);
    const messageId = await group.sendText("gm");
    const messages = await group.messages();
    const textMessage = messages[1];
    expect(textMessage.content).toBe("gm");
    expect(textMessage.contentType).toEqual(contentTypeText());
    expect(textMessage.fallback).toBeUndefined();
    expect(isText(textMessage)).toBe(true);
    if (isText(textMessage)) {
      expectTypeOf(textMessage).toEqualTypeOf<DecodedMessage<string>>();
    }
    const message = client1.conversations.getMessageById(messageId);
    expect(message).toBeDefined();
    expect(message?.content).toBe("gm");
    expect(message?.contentType).toEqual(contentTypeText());
  });

  it("should send and receive markdown content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);
    const messageId = await group.sendMarkdown("# gm");
    const messages = await group.messages();
    const markdownMessage = messages[1];
    expect(markdownMessage.content).toBe("# gm");
    expect(markdownMessage.contentType).toEqual(contentTypeMarkdown());
    expect(markdownMessage.fallback).toBeUndefined();
    expect(isMarkdown(markdownMessage)).toBe(true);
    if (isMarkdown(markdownMessage)) {
      expectTypeOf(markdownMessage).toEqualTypeOf<DecodedMessage<string>>();
    }
    const message = client1.conversations.getMessageById(messageId);
    expect(message).toBeDefined();
    expect(message?.content).toBe("# gm");
    expect(message?.contentType).toEqual(contentTypeMarkdown());
  });

  describe("Reaction", () => {
    it("should send and receive reaction content with added action", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const textMessageId = await group.sendText("Hello!");
      const reaction: Reaction = {
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
        action: ReactionAction.Added,
        content: "👍",
        schema: ReactionSchema.Unicode,
      };
      const reactionId = await group.sendReaction(reaction);
      expect(reactionId).toBeDefined();
      const messages = await group.messages();
      const textMessage = messages[1];
      expect(textMessage.reactions.length).toBe(1);
      const decodedReaction = textMessage.reactions[0];
      expect(decodedReaction.id).toBe(reactionId);
      expect(decodedReaction.contentType).toEqual(contentTypeReaction());
      expect(decodedReaction.content).toEqual(reaction);
      expect(decodedReaction.senderInboxId).toBe(client1.inboxId);
      expect(decodedReaction.fallback).toBe(
        `Reacted with "👍" to an earlier message`,
      );
      expect(isReaction(decodedReaction)).toBe(true);
      if (isReaction(decodedReaction)) {
        expectTypeOf(decodedReaction).toEqualTypeOf<DecodedMessage<Reaction>>();
      }
      const message = client1.conversations.getMessageById(reactionId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual(reaction);
      expect(message?.contentType).toEqual(contentTypeReaction());
    });

    it("should send and receive reaction content with removed action", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const textMessageId = await group.sendText("Hello!");
      const reaction: Reaction = {
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
        action: ReactionAction.Removed,
        content: "👍",
        schema: ReactionSchema.Unicode,
      };
      const reactionId = await group.sendReaction(reaction);
      const messages = await group.messages();
      const textMessage = messages[1];
      expect(textMessage.reactions.length).toBe(1);
      const decodedReaction = textMessage.reactions[0];
      expect(decodedReaction.id).toBe(reactionId);
      expect(decodedReaction.contentType).toEqual(contentTypeReaction());
      expect(decodedReaction.content).toEqual(reaction);
      expect(decodedReaction.senderInboxId).toBe(client1.inboxId);
      expect(decodedReaction.fallback).toBe(
        `Removed "👍" from an earlier message`,
      );
    });

    it("should send and receive reaction content with custom schema", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const textMessageId = await group.sendText("Hello!");
      const reaction: Reaction = {
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
        action: ReactionAction.Added,
        content: "custom_reaction",
        schema: ReactionSchema.Custom,
      };
      const reactionId = await group.sendReaction(reaction);
      const messages = await group.messages();
      const textMessage = messages[1];
      expect(textMessage.reactions.length).toBe(1);
      const decodedReaction = textMessage.reactions[0];
      expect(decodedReaction.id).toBe(reactionId);
      expect(decodedReaction.contentType).toEqual(contentTypeReaction());
      expect(decodedReaction.content).toEqual(reaction);
      expect(decodedReaction.senderInboxId).toBe(client1.inboxId);
      expect(decodedReaction.fallback).toBe(
        `Reacted with "custom_reaction" to an earlier message`,
      );
    });

    it("should send and receive reaction content with shortcode schema", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const textMessageId = await group.sendText("Hello!");
      const reaction: Reaction = {
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
        action: ReactionAction.Added,
        content: ":grin:",
        schema: ReactionSchema.Shortcode,
      };
      const reactionId = await group.sendReaction(reaction);
      const messages = await group.messages();
      const textMessage = messages[1];
      expect(textMessage.reactions.length).toBe(1);
      const decodedReaction = textMessage.reactions[0];
      expect(decodedReaction.id).toBe(reactionId);
      expect(decodedReaction.contentType).toEqual(contentTypeReaction());
      expect(decodedReaction.content).toEqual(reaction);
      expect(decodedReaction.senderInboxId).toBe(client1.inboxId);
      expect(decodedReaction.fallback).toBe(
        `Reacted with ":grin:" to an earlier message`,
      );
    });
  });

  describe("Reply", () => {
    it("should send and receive reply with text content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const textMessageId = await group.sendText("Original message");
      const reply: XmtpReply = {
        content: encodeText("This is a text reply"),
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
      };
      const replyId = await group.sendReply(reply);

      const messages = await group.messages();
      const replyMessage = messages[2];
      expect(replyMessage.contentType).toEqual(contentTypeReply());
      const replyContent = replyMessage.content as EnrichedReply<string>;
      expect(replyContent.referenceId).toBe(textMessageId);
      expect(replyContent.content).toBe("This is a text reply");
      expect(replyContent.contentType).toEqual(contentTypeText());
      expect(replyContent.inReplyTo).toBeDefined();
      expect(replyContent.inReplyTo?.id).toBe(textMessageId);
      expect(replyContent.inReplyTo?.content).toBe("Original message");
      expect(replyMessage.fallback).toBe(
        `Replied with "This is a text reply" to an earlier message`,
      );
      expect(isReply(replyMessage)).toBe(true);
      expect(isTextReply(replyMessage)).toBe(true);
      if (isTextReply(replyMessage)) {
        expectTypeOf(replyMessage).toEqualTypeOf<
          DecodedMessage<EnrichedReply<string>>
        >();
      }
      const message = client1.conversations.getMessageById(replyId);
      expect(message).toBeDefined();
      expect(message?.contentType).toEqual(contentTypeReply());
      const replyContent2 = message?.content as EnrichedReply<string>;
      expect(replyContent2.referenceId).toBe(textMessageId);
      expect(replyContent2.content).toBe("This is a text reply");
      expect(replyContent2.inReplyTo).toBeDefined();
      expect(replyContent2.inReplyTo?.id).toBe(textMessageId);
      expect(replyContent2.inReplyTo?.content).toBe("Original message");
    });

    it("should send and receive reply with non-text content (attachment)", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const textMessageId = await group.sendText("Original message");
      const attachment: Attachment = {
        filename: "reply.png",
        mimeType: "image/png",
        content: new Uint8Array([1, 2, 3, 4]),
      };
      const reply: XmtpReply = {
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
        content: encodeAttachment(attachment),
      };
      await group.sendReply(reply);

      const messages = await group.messages();
      const replyMessage = messages[2];
      expect(isReply(replyMessage)).toBe(true);
      if (isReply(replyMessage)) {
        expectTypeOf(replyMessage).toEqualTypeOf<
          DecodedMessage<EnrichedReply>
        >();
      }
      expect(replyMessage.contentType).toEqual(contentTypeReply());
      const replyContent = replyMessage.content as EnrichedReply<Attachment>;
      expect(replyContent.referenceId).toBe(textMessageId);
      expect(replyContent.content).toEqual(attachment);
      expect(replyContent.contentType).toEqual(contentTypeAttachment());
      expect(replyContent.inReplyTo).toBeDefined();
      expect(replyContent.inReplyTo?.id).toBe(textMessageId);
      expect(replyContent.inReplyTo?.content).toBe("Original message");
      expect(replyMessage.fallback).toBe(`Replied to an earlier message`);
      expect(isReply(replyMessage)).toBe(true);
      expect(isTextReply(replyMessage)).toBe(false);
    });

    it("should send and receive reply with custom content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const testCodec = new TestCodec();
      const client1 = await createRegisteredClient(signer1, {
        codecs: [testCodec],
      });
      const client2 = await createRegisteredClient(signer2, {
        codecs: [testCodec],
      });
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const textMessageId = await group.sendText("Original message");
      const reply: XmtpReply = {
        content: testCodec.encode({ test: "test" }),
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
      };
      await group.sendReply(reply);
      const messages = await group.messages();
      const replyMessage = messages[2];
      expect(replyMessage.contentType).toEqual(contentTypeReply());
      const replyContent = replyMessage.content as EnrichedReply<{
        test: string;
      }>;
      expect(replyContent.referenceId).toBe(textMessageId);
      expect(replyContent.content).toEqual({ test: "test" });
      expect(replyContent.contentType).toEqual(testCodec.contentType);
      expect(replyContent.inReplyTo).toBeDefined();
      expect(replyContent.inReplyTo?.id).toBe(textMessageId);
      expect(replyContent.inReplyTo?.content).toBe("Original message");
      expect(replyMessage.fallback).toBe(`Replied to an earlier message`);
    });
  });

  describe("Attachment", () => {
    it("should send and receive attachment content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const attachment: Attachment = {
        filename: "test.txt",
        mimeType: "text/plain",
        content: new Uint8Array([1, 2, 3]),
      };
      const attachmentId = await group.sendAttachment(attachment);
      const messages = await group.messages();
      const attachmentMessage = messages[1];
      expect(attachmentMessage.content).toEqual(attachment);
      expect(attachmentMessage.contentType).toEqual(contentTypeAttachment());
      expect(attachmentMessage.fallback).toBe(
        `Can't display ${attachment.filename}. This app doesn't support attachments.`,
      );
      expect(isAttachment(attachmentMessage)).toBe(true);
      if (isAttachment(attachmentMessage)) {
        expectTypeOf(attachmentMessage).toEqualTypeOf<
          DecodedMessage<Attachment>
        >();
      }
      const message = client1.conversations.getMessageById(attachmentId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual(attachment);
      expect(message?.contentType).toEqual(contentTypeAttachment());
    });

    it("should send and receive attachment content without filename", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const attachment: Attachment = {
        mimeType: "text/plain",
        content: new Uint8Array([1, 2, 3]),
      };
      await group.sendAttachment(attachment);
      const messages = await group.messages();
      const attachmentMessage = messages[1];
      expect(attachmentMessage.content).toEqual(attachment);
      expect(attachmentMessage.contentType).toEqual(contentTypeAttachment());
      expect(attachmentMessage.fallback).toBe(
        "Can't display this content. This app doesn't support attachments.",
      );
    });
  });

  describe("RemoteAttachment", () => {
    it("should encrypt and decrypt attachment content", () => {
      const attachment: Attachment = {
        filename: "test.txt",
        mimeType: "text/plain",
        content: new Uint8Array([1, 2, 3]),
      };
      const encryptedAttachment = encryptAttachment(attachment);
      const remoteAttachment: RemoteAttachment = {
        url: "https://example.com/test.txt",
        contentDigest: encryptedAttachment.contentDigest,
        secret: encryptedAttachment.secret,
        salt: encryptedAttachment.salt,
        nonce: encryptedAttachment.nonce,
        scheme: "https",
        contentLength: encryptedAttachment.contentLength,
        filename: encryptedAttachment.filename,
      };
      const decryptedAttachment = decryptAttachment(
        encryptedAttachment.payload,
        remoteAttachment,
      );
      expect(decryptedAttachment).toEqual(attachment);
    });

    it("should send and receive remote attachment content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const remoteAttachment: RemoteAttachment = {
        url: "https://example.com/test.txt",
        contentDigest: "1234567890",
        secret: new Uint8Array([1, 2, 3]),
        salt: new Uint8Array([4, 5, 6]),
        nonce: new Uint8Array([7, 8, 9]),
        scheme: "https",
        contentLength: 100,
        filename: "test.txt",
      };
      const remoteAttachmentId =
        await group.sendRemoteAttachment(remoteAttachment);
      const messages = await group.messages();
      const remoteAttachmentMessage = messages[1];
      expect(remoteAttachmentMessage.content).toEqual(remoteAttachment);
      expect(remoteAttachmentMessage.contentType).toEqual(
        contentTypeRemoteAttachment(),
      );
      expect(remoteAttachmentMessage.fallback).toBe(
        `Can't display ${remoteAttachment.filename}. This app doesn't support remote attachments.`,
      );
      expect(isRemoteAttachment(remoteAttachmentMessage)).toBe(true);
      if (isRemoteAttachment(remoteAttachmentMessage)) {
        expectTypeOf(remoteAttachmentMessage).toEqualTypeOf<
          DecodedMessage<RemoteAttachment>
        >();
      }
      const message = client1.conversations.getMessageById(remoteAttachmentId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual(remoteAttachment);
      expect(message?.contentType).toEqual(contentTypeRemoteAttachment());
    });

    it("should send and receive remote attachment content without filename", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const remoteAttachment: RemoteAttachment = {
        url: "https://example.com/test.txt",
        contentDigest: "1234567890",
        secret: new Uint8Array([1, 2, 3]),
        salt: new Uint8Array([4, 5, 6]),
        nonce: new Uint8Array([7, 8, 9]),
        scheme: "https",
        contentLength: 100,
      };
      await group.sendRemoteAttachment(remoteAttachment);
      const messages = await group.messages();
      const remoteAttachmentMessage = messages[1];
      expect(remoteAttachmentMessage.contentType).toEqual(
        contentTypeRemoteAttachment(),
      );
      expect(remoteAttachmentMessage.content).toEqual(remoteAttachment);
      expect(remoteAttachmentMessage.fallback).toBe(
        "Can't display this content. This app doesn't support remote attachments.",
      );
    });
  });

  it("should send and receive multi remote attachment content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);
    const multiRemoteAttachment: MultiRemoteAttachment = {
      attachments: [
        {
          url: "https://example.com/test.txt",
          contentDigest: "sha256:1234567890",
          secret: new Uint8Array([1, 2, 3]),
          salt: new Uint8Array([4, 5, 6]),
          nonce: new Uint8Array([7, 8, 9]),
          scheme: "https",
          contentLength: 100,
          filename: "test.txt",
        },
        {
          url: "https://example.com/test2.txt",
          contentDigest: "sha256:1234567891",
          secret: new Uint8Array([1, 2, 3]),
          salt: new Uint8Array([4, 5, 6]),
          nonce: new Uint8Array([7, 8, 9]),
          scheme: "https",
          contentLength: 100,
          filename: "test2.txt",
        },
      ],
    };
    await group.sendMultiRemoteAttachment(multiRemoteAttachment);
    const messages = await group.messages();
    const multiRemoteAttachmentMessage = messages[1];
    expect(multiRemoteAttachmentMessage.content).toEqual(multiRemoteAttachment);
    expect(multiRemoteAttachmentMessage.contentType).toEqual(
      contentTypeMultiRemoteAttachment(),
    );
    expect(multiRemoteAttachmentMessage.fallback).toBe(
      "Can't display this content. This app doesn't support multiple remote attachments.",
    );
    expect(isMultiRemoteAttachment(multiRemoteAttachmentMessage)).toBe(true);
    if (isMultiRemoteAttachment(multiRemoteAttachmentMessage)) {
      expectTypeOf(multiRemoteAttachmentMessage).toEqualTypeOf<
        DecodedMessage<MultiRemoteAttachment>
      >();
    }
  });

  it("should send read receipts and get last read times", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);
    await group.sendText("gm");
    const readReceiptId = await group.sendReadReceipt();
    const readTimes = await group.lastReadTimes();
    expect(Object.keys(readTimes)).toContain(client1.inboxId);
    const message = client1.conversations.getMessageById(readReceiptId);
    expect(message).toBeDefined();
    expect(message?.contentType).toEqual(contentTypeReadReceipt());
    expect(message?.content).toEqual({});
    expect(isReadReceipt(message!)).toBe(true);
    await client2.conversations.syncAll();
    const group2 = client2.conversations.listGroups()[0];
    await group2.sendReadReceipt();
    const readTimes2 = await group2.lastReadTimes();
    expect(Object.keys(readTimes2)).toContain(client1.inboxId);
    expect(Object.keys(readTimes2)).toContain(client2.inboxId);
  });

  describe("TransactionReference", () => {
    it("should send and receive transaction reference content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const transactionReference: TransactionReference = {
        namespace: "test",
        networkId: "1",
        reference: "1234567890",
      };
      const transactionReferenceId =
        await group.sendTransactionReference(transactionReference);
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual({
        namespace: "test",
        networkId: "1",
        reference: "1234567890",
      });
      expect(transactionReferenceMessage.contentType).toEqual(
        contentTypeTransactionReference(),
      );
      expect(transactionReferenceMessage.fallback).toBe(
        `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: 1234567890`,
      );
      expect(isTransactionReference(transactionReferenceMessage)).toBe(true);
      if (isTransactionReference(transactionReferenceMessage)) {
        expectTypeOf(transactionReferenceMessage).toEqualTypeOf<
          DecodedMessage<TransactionReference>
        >();
      }
      const message = client1.conversations.getMessageById(
        transactionReferenceId,
      );
      expect(message).toBeDefined();
      expect(message?.content).toEqual(transactionReference);
      expect(message?.contentType).toEqual(contentTypeTransactionReference());
    });

    it("should send and receive transaction reference content without namespace", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const transactionReference: TransactionReference = {
        networkId: "1",
        reference: "1234567890",
      };
      await group.sendTransactionReference(transactionReference);
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual(transactionReference);
      expect(transactionReferenceMessage.contentType).toEqual(
        contentTypeTransactionReference(),
      );
      expect(transactionReferenceMessage.fallback).toBe(
        `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: 1234567890`,
      );
    });

    it("should send and receive transaction reference content with empty reference", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const transactionReference: TransactionReference = {
        networkId: "1",
        reference: "",
      };
      await group.sendTransactionReference(transactionReference);
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual(transactionReference);
      expect(transactionReferenceMessage.contentType).toEqual(
        contentTypeTransactionReference(),
      );
      expect(transactionReferenceMessage.fallback).toBe("Crypto transaction");
    });

    it("should send and receive transaction reference content with metadata", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const transactionReference: TransactionReference = {
        namespace: "test",
        networkId: "1",
        reference: "1234567890",
        metadata: {
          transactionType: "transfer",
          currency: "USDC",
          amount: 100,
          decimals: 18,
          fromAddress: "0x1234567890",
          toAddress: "0x1234567890",
        },
      };
      await group.sendTransactionReference(transactionReference);
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual(transactionReference);
      expect(transactionReferenceMessage.contentType).toEqual(
        contentTypeTransactionReference(),
      );
      expect(transactionReferenceMessage.fallback).toBe(
        `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: 1234567890`,
      );
    });
  });

  describe("WalletSendCalls", () => {
    it("should send and receive wallet send calls content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const walletSendCalls: WalletSendCalls = {
        version: "1.0",
        chainId: "1",
        from: "0x1234567890",
        calls: [
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
          },
        ],
      };

      const walletSendCallsId =
        await group.sendWalletSendCalls(walletSendCalls);
      const messages = await group.messages();
      const walletSendCallsMessage = messages[1];
      expect(walletSendCallsMessage.content).toEqual(walletSendCalls);
      expect(walletSendCallsMessage.contentType).toEqual(
        contentTypeWalletSendCalls(),
      );
      expect(walletSendCallsMessage.fallback).toBe(
        `[Transaction request generated]: ${JSON.stringify(walletSendCalls)}`,
      );
      expect(isWalletSendCalls(walletSendCallsMessage)).toBe(true);
      if (isWalletSendCalls(walletSendCallsMessage)) {
        expectTypeOf(walletSendCallsMessage).toEqualTypeOf<
          DecodedMessage<WalletSendCalls>
        >();
      }
      const message = client1.conversations.getMessageById(walletSendCallsId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual(walletSendCalls);
      expect(message?.contentType).toEqual(contentTypeWalletSendCalls());
    });

    it("should send and receive wallet send calls content with multiple calls", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const walletSendCalls: WalletSendCalls = {
        version: "1.0",
        chainId: "1",
        from: "0x1234567890",
        calls: [
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
          },
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
          },
        ],
      };

      await group.sendWalletSendCalls(walletSendCalls);
      const messages = await group.messages();
      const walletSendCallsMessage = messages[1];
      expect(walletSendCallsMessage.content).toEqual(walletSendCalls);
      expect(walletSendCallsMessage.contentType).toEqual(
        contentTypeWalletSendCalls(),
      );
      expect(walletSendCallsMessage.fallback).toBe(
        `[Transaction request generated]: ${JSON.stringify(walletSendCalls)}`,
      );
    });

    it("should send and receive wallet send calls content with metadata and capabilities", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const walletSendCalls: WalletSendCalls = {
        version: "1.0",
        chainId: "1",
        from: "0x1234567890",
        calls: [
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
            metadata: {
              description: "test",
              transactionType: "test",
              note: "test",
            },
          },
        ],
        capabilities: {
          test: "test",
        },
      };

      await group.sendWalletSendCalls(walletSendCalls);
      const messages = await group.messages();
      const walletSendCallsMessage = messages[1];
      expect(walletSendCallsMessage.content).toEqual(walletSendCalls);
      expect(walletSendCallsMessage.contentType).toEqual(
        contentTypeWalletSendCalls(),
      );
      expect(walletSendCallsMessage.fallback).toBe(
        `[Transaction request generated]: ${JSON.stringify(walletSendCalls)}`,
      );
    });

    it("should reject when sending wallet send calls content with metadata and missing `description` field", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const walletSendCalls: WalletSendCalls = {
        version: "1.0",
        chainId: "1",
        from: "0x1234567890",
        calls: [
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
            metadata: {
              transactionType: "test",
            },
          },
        ],
      };

      await expect(group.sendWalletSendCalls(walletSendCalls)).rejects.toThrow(
        "missing field `description`",
      );
    });

    it("should reject when sending wallet send calls content with metadata and missing `transactionType` field", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);
      const walletSendCalls: WalletSendCalls = {
        version: "1.0",
        chainId: "1",
        from: "0x1234567890",
        calls: [
          {
            to: "0x1234567890",
            data: "0x1234567890",
            value: "0x1234567890",
            metadata: {
              description: "test",
            },
          },
        ],
      };

      await expect(group.sendWalletSendCalls(walletSendCalls)).rejects.toThrow(
        "missing field `transactionType`",
      );
    });
  });

  describe("Actions", () => {
    it("should send and receive actions", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const actions: Actions = {
        id: "actions-1",
        description: "Choose an option",
        actions: [
          {
            id: "opt-1",
            label: "Option 1",
            style: ActionStyle.Primary,
          },
          {
            id: "opt-2",
            label: "Option 2",
            style: ActionStyle.Secondary,
          },
        ],
      };

      const actionsId = await group.sendActions(actions);

      const messages = await group.messages();
      const actionsMessage = messages[1];
      expect(actionsMessage.contentType).toEqual(contentTypeActions());
      const actionsContent = actionsMessage.content as Actions;
      expect(actionsContent).toEqual(actions);
      expect(actionsMessage.fallback).toBe(
        `Choose an option\n\n[1] Option 1\n[2] Option 2\n\nReply with the number to select`,
      );
      expect(isActions(actionsMessage)).toBe(true);
      if (isActions(actionsMessage)) {
        expectTypeOf(actionsMessage).toEqualTypeOf<DecodedMessage<Actions>>();
      }
      const message = client1.conversations.getMessageById(actionsId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual(actions);
      expect(message?.contentType).toEqual(contentTypeActions());
    });

    it("should send and receive actions with all styles", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const actions: Actions = {
        id: "action-styles",
        description: "All styles",
        actions: [
          {
            id: "primary",
            label: "Primary",
            style: ActionStyle.Primary,
          },
          {
            id: "secondary",
            label: "Secondary",
            style: ActionStyle.Secondary,
          },
          {
            id: "danger",
            label: "Danger",
            style: ActionStyle.Danger,
          },
        ],
      };

      await group.sendActions(actions);

      const messages = await group.messages();
      const actionsMessage = messages[1];
      expect(actionsMessage.content).toEqual(actions);
      expect(actionsMessage.contentType).toEqual(contentTypeActions());
      expect(actionsMessage.fallback).toBe(
        `All styles\n\n[1] Primary\n[2] Secondary\n[3] Danger\n\nReply with the number to select`,
      );
    });

    it("should send and receive actions with expiration", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const expiresAtNs = 1700000000000000000n;

      const actions: Actions = {
        id: "expiring-actions",
        description: "Expiring action",
        actions: [
          {
            id: "opt-1",
            label: "Option 1",
            style: ActionStyle.Primary,
            expiresAtNs: expiresAtNs,
          },
        ],
        expiresAtNs: expiresAtNs,
      };

      await group.sendActions(actions);

      const messages = await group.messages();
      const actionsMessage = messages[1];
      expect(actionsMessage.content).toEqual(actions);
      expect(actionsMessage.contentType).toEqual(contentTypeActions());
      expect(actionsMessage.fallback).toBe(
        `Expiring action\n\n[1] Option 1\n\nReply with the number to select`,
      );
    });

    it("should send and receive actions with image URL", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const actions: Actions = {
        id: "action-with-image",
        description: "Action with image",
        actions: [
          {
            id: "opt-1",
            label: "Option 1",
            style: ActionStyle.Primary,
            imageUrl: "https://example.com/image.png",
          },
        ],
      };

      await group.sendActions(actions);

      const messages = await group.messages();
      const actionsMessage = messages[1];
      expect(actionsMessage.content).toEqual(actions);
      expect(actionsMessage.contentType).toEqual(contentTypeActions());
      expect(actionsMessage.fallback).toBe(
        `Action with image\n\n[1] Option 1\n\nReply with the number to select`,
      );
    });
  });

  describe("Intent", () => {
    it("should send and receive intent", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const intent: Intent = {
        id: "intent-1",
        actionId: "opt-1",
      };

      const intentId = await group.sendIntent(intent);

      const messages = await group.messages();
      const intentMessage = messages[1];
      expect(intentMessage.contentType).toEqual(contentTypeIntent());
      expect(intentMessage.content).toEqual(intent);
      expect(intentMessage.fallback).toBe(`User selected action: opt-1`);
      expect(isIntent(intentMessage)).toBe(true);
      if (isIntent(intentMessage)) {
        expectTypeOf(intentMessage).toEqualTypeOf<DecodedMessage<Intent>>();
      }
      const message = client1.conversations.getMessageById(intentId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual(intent);
      expect(message?.contentType).toEqual(contentTypeIntent());
    });

    it("should send and receive intent with metadata", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.createGroup([client2.inboxId]);

      const intent: Intent = {
        id: "intent-2",
        actionId: "opt-2",
        metadata: {
          source: "test",
          timestamp: "2024-01-01",
        },
      };

      await group.sendIntent(intent);

      const messages = await group.messages();
      const intentMessage = messages[1];
      expect(intentMessage.contentType).toEqual(contentTypeIntent());
      expect(intentMessage.content).toEqual(intent);
      expect(intentMessage.fallback).toBe(`User selected action: opt-2`);
    });
  });

  it("should send and receive group updated content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.createGroup([client2.inboxId]);
    await group.updateName("test");
    await group.updateDescription("test");
    await group.updateImageUrl("test");
    await group.updateAppData("test");
    await group.addAdmin(client2.inboxId);
    await group.removeAdmin(client2.inboxId);
    await group.addSuperAdmin(client2.inboxId);
    await group.removeSuperAdmin(client2.inboxId);
    await group.removeMembers([client2.inboxId]);

    const messages = await group.messages();
    expect(messages.length).toBe(10);

    for (const message of messages) {
      expect(message.contentType).toEqual(contentTypeGroupUpdated());
      expect(isGroupUpdated(message)).toBe(true);
      if (isGroupUpdated(message)) {
        expectTypeOf(message).toEqualTypeOf<DecodedMessage<GroupUpdated>>();
      }
      const groupUpdated = client1.conversations.getMessageById(message.id);
      expect(groupUpdated?.content).toEqual(message.content);
      expect(groupUpdated?.contentType).toEqual(contentTypeGroupUpdated());
    }

    expect(messages[0].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [{ inboxId: client2.inboxId }],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });

    expect(messages[1].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [
        {
          fieldName: metadataFieldName(MetadataField.GroupName),
          oldValue: "",
          newValue: "test",
        },
      ],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
    expect(messages[2].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [
        {
          fieldName: metadataFieldName(MetadataField.Description),
          oldValue: "",
          newValue: "test",
        },
      ],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
    expect(messages[3].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [
        {
          fieldName: metadataFieldName(MetadataField.GroupImageUrlSquare),
          oldValue: "",
          newValue: "test",
        },
      ],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
    expect(messages[4].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [
        {
          fieldName: metadataFieldName(MetadataField.AppData),
          oldValue: "",
          newValue: "test",
        },
      ],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
    expect(messages[5].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [],
      addedAdminInboxes: [{ inboxId: client2.inboxId }],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
    expect(messages[6].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [],
      addedAdminInboxes: [],
      removedAdminInboxes: [{ inboxId: client2.inboxId }],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
    expect(messages[7].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [{ inboxId: client2.inboxId }],
      removedSuperAdminInboxes: [],
    });
    expect(messages[8].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [],
      leftInboxes: [],
      metadataFieldChanges: [],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [{ inboxId: client2.inboxId }],
    });
    expect(messages[9].content).toEqual({
      initiatedByInboxId: client1.inboxId,
      addedInboxes: [],
      removedInboxes: [{ inboxId: client2.inboxId }],
      leftInboxes: [],
      metadataFieldChanges: [],
      addedAdminInboxes: [],
      removedAdminInboxes: [],
      addedSuperAdminInboxes: [],
      removedSuperAdminInboxes: [],
    });
  });

  describe("Custom content types", () => {
    let consoleWarnSpy: Mock;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should send and receive custom content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const testCodec = new TestCodec();
      const clientWithCodec = await createRegisteredClient(signer1, {
        codecs: [testCodec],
      });
      const client = await createRegisteredClient(signer2);
      const group = await clientWithCodec.conversations.createGroup([
        client.inboxId,
      ]);
      const customContentId = await group.send(
        testCodec.encode({ test: "test" }),
      );
      const messages = await group.messages();
      expect(messages[1].content).toEqual({ test: "test" });
      expect(messages[1].contentType).toEqual(testCodec.contentType);
      const message =
        clientWithCodec.conversations.getMessageById(customContentId);
      expect(message).toBeDefined();
      expect(message?.content).toEqual({ test: "test" });
      expect(message?.contentType).toEqual(testCodec.contentType);
    });

    it("should have undefined content when receiving custom content without codec", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const testCodec = new TestCodec();
      const clientWithCodec = await createRegisteredClient(signer1, {
        codecs: [testCodec],
      });
      const client = await createRegisteredClient(signer2);
      const group = await clientWithCodec.conversations.createGroup([
        client.inboxId,
      ]);
      await group.send(testCodec.encode({ test: "test" }));
      await client.conversations.sync();
      const group2 = await client.conversations.getConversationById(group.id);
      expect(group2).toBeDefined();
      await group2!.sync();
      const messages = await group2!.messages();
      expect(messages[1].content).toBeUndefined();
      expect(messages[1].contentType).toEqual(testCodec.contentType);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `No codec found for content type "${contentTypeToString(testCodec.contentType)}"`,
      );
    });

    it("should have undefined content when receiving custom content with decode failure", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const decodeFailureCodec = new DecodeFailureCodec();
      const clientWithCodec = await createRegisteredClient(signer1, {
        codecs: [decodeFailureCodec],
      });
      const client2WithCodec = await createRegisteredClient(signer2, {
        codecs: [decodeFailureCodec],
      });
      const group = await clientWithCodec.conversations.createGroup([
        client2WithCodec.inboxId,
      ]);
      await group.send(decodeFailureCodec.encode("test"));
      await client2WithCodec.conversations.sync();
      const group2 = await client2WithCodec.conversations.getConversationById(
        group.id,
      );
      expect(group2).toBeDefined();
      await group2!.sync();
      const messages = await group2!.messages();
      expect(messages[1].content).toBeUndefined();
      expect(messages[1].contentType).toEqual(decodeFailureCodec.contentType);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Error decoding custom content: Decode failure",
      );
    });
  });
});
