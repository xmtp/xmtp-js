import { contentTypeToString } from "@xmtp/content-type-primitives";
import {
  DecodedMessageContentType,
  type ContentTypeId,
  type DecodedMessageContent,
  type DeliveryStatus,
  type EncodedContent,
  type EnrichedReply,
  type GroupMessageKind,
  type Reaction,
  type DecodedMessage as XmtpDecodedMessage,
} from "@xmtp/node-bindings";
import type { CodecRegistry } from "@/CodecRegistry";
import { nsToDate } from "@/utils/date";

const getContentFromDecodedMessageContent = <T = unknown>(
  content: DecodedMessageContent,
): T => {
  switch (content.type) {
    case DecodedMessageContentType.Text: {
      return content.text as T;
    }
    case DecodedMessageContentType.Markdown: {
      return content.markdown as T;
    }
    case DecodedMessageContentType.Reply: {
      return content.reply as T;
    }
    case DecodedMessageContentType.Reaction: {
      return content.reaction as T;
    }
    case DecodedMessageContentType.Attachment: {
      return content.attachment as T;
    }
    case DecodedMessageContentType.RemoteAttachment: {
      return content.remoteAttachment as T;
    }
    case DecodedMessageContentType.MultiRemoteAttachment: {
      return content.multiRemoteAttachment as T;
    }
    case DecodedMessageContentType.TransactionReference: {
      return content.transactionReference as T;
    }
    case DecodedMessageContentType.GroupUpdated: {
      return content.groupUpdated as T;
    }
    case DecodedMessageContentType.ReadReceipt: {
      return content.readReceipt as T;
    }
    case DecodedMessageContentType.LeaveRequest: {
      return content.leaveRequest as T;
    }
    case DecodedMessageContentType.WalletSendCalls: {
      return content.walletSendCalls as T;
    }
    case DecodedMessageContentType.Actions: {
      return content.actions as T;
    }
    case DecodedMessageContentType.Intent: {
      return content.intent as T;
    }
    case DecodedMessageContentType.Custom: {
      return content.custom as T;
    }
  }
  return null as T;
};

/**
 * Represents a decoded XMTP message
 *
 * @class
 * @property {unknown} content - The decoded content of the message
 * @property {ContentTypeId} contentType - The content type of the message content
 * @property {string} conversationId - Unique identifier for the conversation
 * @property {MessageDeliveryStatus} deliveryStatus - Current delivery status of the message ("unpublished" | "published" | "failed")
 * @property {bigint} expiresAtNs - Timestamp when the message will expire (in nanoseconds)
 * @property {Date} expiresAt - Timestamp when the message will expire
 * @property {string} [fallback] - Optional fallback text for the message
 * @property {string} id - Unique identifier for the message
 * @property {MessageKind} kind - Type of message ("application" | "membership_change")
 * @property {number} numReplies - Number of replies to the message
 * @property {DecodedMessage<Reaction>[]} reactions - Reactions to the message
 * @property {string} senderInboxId - Identifier for the sender's inbox
 * @property {Date} sentAt - Timestamp when the message was sent
 * @property {bigint} sentAtNs - Timestamp when the message was sent (in nanoseconds)
 */
export class DecodedMessage<ContentTypes = unknown> {
  content: ContentTypes | undefined;
  contentType: ContentTypeId;
  conversationId: string;
  deliveryStatus: DeliveryStatus;
  expiresAtNs?: bigint;
  expiresAt?: Date;
  fallback?: string;
  id: string;
  kind: GroupMessageKind;
  numReplies: number;
  reactions: DecodedMessage<Reaction>[];
  senderInboxId: string;
  sentAt: Date;
  sentAtNs: bigint;

  constructor(codecRegistry: CodecRegistry, message: XmtpDecodedMessage) {
    this.id = message.id;
    this.expiresAtNs = message.expiresAtNs ?? undefined;
    this.expiresAt = message.expiresAtNs
      ? nsToDate(message.expiresAtNs)
      : undefined;
    this.sentAtNs = message.sentAtNs;
    this.sentAt = nsToDate(message.sentAtNs);
    this.conversationId = message.conversationId;
    this.senderInboxId = message.senderInboxId;
    this.contentType = message.contentType;
    this.fallback = message.fallback ?? undefined;
    this.kind = message.kind;
    this.deliveryStatus = message.deliveryStatus;

    this.numReplies = message.numReplies;
    this.reactions = message.reactions.map(
      (reaction) => new DecodedMessage<Reaction>(codecRegistry, reaction),
    );

    this.content =
      getContentFromDecodedMessageContent<ContentTypes>(message.content) ??
      undefined;

    switch (message.content.type) {
      case DecodedMessageContentType.Reply: {
        const reply = message.content.reply as EnrichedReply;
        let replyContent = getContentFromDecodedMessageContent<ContentTypes>(
          reply.content,
        );
        if (reply.content.type === DecodedMessageContentType.Custom) {
          const codec = codecRegistry.getCodec<ContentTypes>(this.contentType);
          if (codec) {
            try {
              replyContent = codec.decode(replyContent as EncodedContent);
            } catch (error) {
              if (error instanceof Error) {
                console.warn(`Error decoding custom content: ${error.message}`);
              } else {
                console.warn(`Error decoding custom content`);
              }
            }
          }
        }
        this.content = {
          referenceId: reply.referenceId,
          content: replyContent,
          inReplyTo: reply.inReplyTo
            ? new DecodedMessage<ContentTypes>(codecRegistry, reply.inReplyTo)
            : null,
        } as ContentTypes;
        break;
      }
      case DecodedMessageContentType.Custom: {
        const customContent = message.content.custom;
        if (customContent !== null) {
          const codec = codecRegistry.getCodec<ContentTypes>(this.contentType);
          if (codec) {
            try {
              this.content = codec.decode(customContent);
            } catch (error) {
              if (error instanceof Error) {
                console.warn(`Error decoding custom content: ${error.message}`);
              } else {
                console.warn(`Error decoding custom content`);
              }
              this.content = undefined;
            }
          } else {
            console.warn(
              `No codec found for content type "${contentTypeToString(this.contentType)}"`,
            );
            this.content = undefined;
          }
        }
        break;
      }
    }
  }
}
