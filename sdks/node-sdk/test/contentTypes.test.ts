import {
  actionsContentType,
  ActionStyle,
  attachmentContentType,
  decryptAttachment,
  encodeAttachment,
  encodeText,
  encryptAttachment,
  groupUpdatedContentType,
  intentContentType,
  markdownContentType,
  multiRemoteAttachmentContentType,
  ReactionAction,
  reactionContentType,
  ReactionSchema,
  remoteAttachmentContentType,
  replyContentType,
  textContentType,
  transactionReferenceContentType,
  walletSendCallsContentType,
  type Actions,
  type Attachment,
  type Intent,
  type MultiRemoteAttachment,
  type Reaction,
  type RemoteAttachment,
  type WalletSendCalls,
  type Reply as XmtpReply,
} from "@xmtp/node-bindings";
import { describe, expect, it } from "vitest";
import type { Reply } from "@/types";
import { createRegisteredClient, createSigner, TestCodec } from "@test/helpers";

describe("Content types", () => {
  it("should send and receive text content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    await group.sendText("gm");
    const messages = await group.messages();
    const textMessage = messages[1];
    expect(textMessage.content).toBe("gm");
    expect(textMessage.contentType).toEqual(textContentType());
    expect(textMessage.fallback).toBeUndefined();
  });

  it("should send and receive markdown content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    await group.sendMarkdown("# gm");
    const messages = await group.messages();
    const markdownMessage = messages[1];
    expect(markdownMessage.content).toBe("# gm");
    expect(markdownMessage.contentType).toEqual(markdownContentType());
    expect(markdownMessage.fallback).toBeUndefined();
  });

  describe("Reaction", () => {
    it("should send and receive reaction content with added action", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      expect(decodedReaction.contentType).toEqual(reactionContentType());
      expect(decodedReaction.content).toEqual(reaction);
      expect(decodedReaction.senderInboxId).toBe(client1.inboxId);
      expect(decodedReaction.fallback).toBe(
        `Reacted with "👍" to an earlier message`,
      );
    });

    it("should send and receive reaction content with removed action", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      expect(decodedReaction.contentType).toEqual(reactionContentType());
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      expect(decodedReaction.contentType).toEqual(reactionContentType());
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      expect(decodedReaction.contentType).toEqual(reactionContentType());
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
      const group = await client1.conversations.newGroup([client2.inboxId]);

      const textMessageId = await group.sendText("Original message");
      const reply: XmtpReply = {
        content: encodeText("This is a text reply"),
        reference: textMessageId,
        referenceInboxId: client1.inboxId,
      };
      await group.sendReply(reply);

      const messages = await group.messages();
      const replyMessage = messages[2];
      expect(replyMessage.contentType).toEqual(replyContentType());
      const replyContent = replyMessage.content as Reply<string>;
      expect(replyContent.referenceId).toBe(textMessageId);
      expect(replyContent.content).toBe("This is a text reply");
      expect(replyContent.inReplyTo).toBeDefined();
      expect(replyContent.inReplyTo?.id).toBe(textMessageId);
      expect(replyContent.inReplyTo?.content).toBe("Original message");
      expect(replyMessage.fallback).toBe(
        `Replied with "This is a text reply" to an earlier message`,
      );
    });

    it("should send and receive reply with non-text content (attachment)", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);

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
      expect(replyMessage.contentType).toEqual(replyContentType());
      const replyContent = replyMessage.content as Reply<Attachment>;
      expect(replyContent.referenceId).toBe(textMessageId);
      expect(replyContent.content).toEqual(attachment);
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
      const attachment: Attachment = {
        filename: "test.txt",
        mimeType: "text/plain",
        content: new Uint8Array([1, 2, 3]),
      };
      await group.sendAttachment(attachment);
      const messages = await group.messages();
      const attachmentMessage = messages[1];
      expect(attachmentMessage.content).toEqual(attachment);
      expect(attachmentMessage.contentType).toEqual(attachmentContentType());
      expect(attachmentMessage.fallback).toBe(
        `Can't display ${attachment.filename}. This app doesn't support attachments.`,
      );
    });

    it("should send and receive attachment content without filename", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
      const attachment: Attachment = {
        mimeType: "text/plain",
        content: new Uint8Array([1, 2, 3]),
      };
      await group.sendAttachment(attachment);
      const messages = await group.messages();
      const attachmentMessage = messages[1];
      expect(attachmentMessage.content).toEqual(attachment);
      expect(attachmentMessage.contentType).toEqual(attachmentContentType());
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      await group.sendRemoteAttachment(remoteAttachment);
      const messages = await group.messages();
      const remoteAttachmentMessage = messages[1];
      expect(remoteAttachmentMessage.content).toEqual(remoteAttachment);
      expect(remoteAttachmentMessage.contentType).toEqual(
        remoteAttachmentContentType(),
      );
      expect(remoteAttachmentMessage.fallback).toBe(
        `Can't display ${remoteAttachment.filename}. This app doesn't support remote attachments.`,
      );
    });

    it("should send and receive remote attachment content without filename", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
        remoteAttachmentContentType(),
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
    const group = await client1.conversations.newGroup([client2.inboxId]);
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
      multiRemoteAttachmentContentType(),
    );
    expect(multiRemoteAttachmentMessage.fallback).toBe(
      "Can't display this content. This app doesn't support multiple remote attachments.",
    );
  });

  it("should send read receipts and get last read times", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    await group.sendText("gm");
    await group.sendReadReceipt();
    const readTimes = await group.lastReadTimes();
    expect(Object.keys(readTimes)).toContain(client1.inboxId);
  });

  describe("TransactionReference", () => {
    it("should send and receive transaction reference content", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
      await group.sendTransactionReference({
        namespace: "test",
        networkId: "1",
        reference: "1234567890",
      });
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual({
        namespace: "test",
        networkId: "1",
        reference: "1234567890",
      });
      expect(transactionReferenceMessage.contentType).toEqual(
        transactionReferenceContentType(),
      );
      expect(transactionReferenceMessage.fallback).toBe(
        `[Crypto transaction] Use a blockchain explorer to learn more using the transaction hash: 1234567890`,
      );
    });

    it("should send and receive transaction reference content without namespace", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
      await group.sendTransactionReference({
        networkId: "1",
        reference: "1234567890",
      });
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual({
        networkId: "1",
        reference: "1234567890",
      });
      expect(transactionReferenceMessage.contentType).toEqual(
        transactionReferenceContentType(),
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
      await group.sendTransactionReference({
        networkId: "1",
        reference: "",
      });
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual({
        networkId: "1",
        reference: "",
      });
      expect(transactionReferenceMessage.contentType).toEqual(
        transactionReferenceContentType(),
      );
      expect(transactionReferenceMessage.fallback).toBe("Crypto transaction");
    });

    it("should send and receive transaction reference content with metadata", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
      await group.sendTransactionReference({
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
      });
      const messages = await group.messages();
      const transactionReferenceMessage = messages[1];
      expect(transactionReferenceMessage.content).toEqual({
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
      });
      expect(transactionReferenceMessage.contentType).toEqual(
        transactionReferenceContentType(),
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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

      await group.sendWalletSendCalls(walletSendCalls);
      const messages = await group.messages();
      const walletSendCallsMessage = messages[1];
      expect(walletSendCallsMessage.content).toEqual(walletSendCalls);
      expect(walletSendCallsMessage.contentType).toEqual(
        walletSendCallsContentType(),
      );
      expect(walletSendCallsMessage.fallback).toBe(
        `[Transaction request generated]: ${JSON.stringify(walletSendCalls)}`,
      );
    });

    it("should send and receive wallet send calls content with multiple calls", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
        walletSendCallsContentType(),
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
        walletSendCallsContentType(),
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      const group = await client1.conversations.newGroup([client2.inboxId]);
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
      const group = await client1.conversations.newGroup([client2.inboxId]);

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

      await group.sendActions(actions);

      const messages = await group.messages();
      const actionsMessage = messages[1];
      expect(actionsMessage.contentType).toEqual(actionsContentType());
      const actionsContent = actionsMessage.content as Actions;
      expect(actionsContent).toEqual(actions);
      expect(actionsMessage.fallback).toBe(
        `Choose an option\n\n[1] Option 1\n[2] Option 2\n\nReply with the number to select`,
      );
    });

    it("should send and receive actions with all styles", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);

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
      expect(actionsMessage.contentType).toEqual(actionsContentType());
      expect(actionsMessage.fallback).toBe(
        `All styles\n\n[1] Primary\n[2] Secondary\n[3] Danger\n\nReply with the number to select`,
      );
    });

    it("should send and receive actions with expiration", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);

      const expiresAtNs = 1700000000000000000;

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
      expect(actionsMessage.contentType).toEqual(actionsContentType());
      expect(actionsMessage.fallback).toBe(
        `Expiring action\n\n[1] Option 1\n\nReply with the number to select`,
      );
    });

    it("should send and receive actions with image URL", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);

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
      expect(actionsMessage.contentType).toEqual(actionsContentType());
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
      const group = await client1.conversations.newGroup([client2.inboxId]);

      const intent: Intent = {
        id: "intent-1",
        actionId: "opt-1",
      };

      await group.sendIntent(intent);

      const messages = await group.messages();
      const intentMessage = messages[1];
      expect(intentMessage.contentType).toEqual(intentContentType());
      expect(intentMessage.content).toEqual(intent);
      expect(intentMessage.fallback).toBe(`User selected action: opt-1`);
    });

    it("should send and receive intent with metadata", async () => {
      const { signer: signer1 } = createSigner();
      const { signer: signer2 } = createSigner();
      const client1 = await createRegisteredClient(signer1);
      const client2 = await createRegisteredClient(signer2);
      const group = await client1.conversations.newGroup([client2.inboxId]);

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
      expect(intentMessage.contentType).toEqual(intentContentType());
      expect(intentMessage.content).toEqual(intent);
      expect(intentMessage.fallback).toBe(`User selected action: opt-2`);
    });
  });

  it("should send and receive group updated content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const client1 = await createRegisteredClient(signer1);
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
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
      expect(message.contentType).toEqual(groupUpdatedContentType());
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
        { fieldName: "group_name", oldValue: "", newValue: "test" },
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
        { fieldName: "description", oldValue: "", newValue: "test" },
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
          fieldName: "group_image_url_square",
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
        { fieldName: "app_data", oldValue: "", newValue: "test" },
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

  it("should send and receive custom content", async () => {
    const { signer: signer1 } = createSigner();
    const { signer: signer2 } = createSigner();
    const testCodec = new TestCodec();
    const client1 = await createRegisteredClient(signer1, {
      codecs: [testCodec],
    });
    const client2 = await createRegisteredClient(signer2);
    const group = await client1.conversations.newGroup([client2.inboxId]);
    await group.send(testCodec.encode({ test: "test" }));
    const messages = await group.messages();
    expect(messages[1].content).toEqual({ test: "test" });
    expect(messages[1].contentType).toEqual(testCodec.contentType);
  });
});
