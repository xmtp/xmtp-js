import {
  DecodedMessageContentType,
  type ContentTypeId,
  type DecodedMessageContent,
  type DeliveryStatus,
  type EnrichedReply,
  type GroupMessageKind,
  type Reaction,
  type DecodedMessage as XmtpDecodedMessage,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
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
 * @property {number} expiresAtNs - Timestamp when the message will expire (in nanoseconds)
 * @property {Date} expiresAt - Timestamp when the message will expire
 * @property {string} [fallback] - Optional fallback text for the message
 * @property {string} id - Unique identifier for the message
 * @property {MessageKind} kind - Type of message ("application" | "membership_change")
 * @property {number} numReplies - Number of replies to the message
 * @property {DecodedMessage<Reaction>[]} reactions - Reactions to the message
 * @property {string} senderInboxId - Identifier for the sender's inbox
 * @property {Date} sentAt - Timestamp when the message was sent
 * @property {number} sentAtNs - Timestamp when the message was sent (in nanoseconds)
 */
export class DecodedMessage<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  content: ContentTypes | undefined;
  contentType: ContentTypeId;
  conversationId: string;
  deliveryStatus: DeliveryStatus;
  expiresAtNs?: number;
  expiresAt?: Date;
  fallback?: string;
  id: string;
  kind: GroupMessageKind;
  numReplies: number;
  reactions: DecodedMessage<Reaction>[];
  senderInboxId: string;
  sentAt: Date;
  sentAtNs: number;

  constructor(client: Client<ContentTypes>, message: XmtpDecodedMessage) {
    this.#client = client;
    this.id = message.id;
    this.expiresAtNs = message.expiresAtNs;
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
      (reaction) =>
        new DecodedMessage<Reaction>(
          this.#client as Client<Reaction>,
          reaction,
        ),
    );

    this.content =
      getContentFromDecodedMessageContent<ContentTypes>(message.content) ??
      undefined;

    switch (message.content.type) {
      case DecodedMessageContentType.Reply: {
        const reply = message.content.reply as EnrichedReply;
        this.content = {
          referenceId: reply.referenceId,
          content: getContentFromDecodedMessageContent<ContentTypes>(
            reply.content,
          ),
          inReplyTo: reply.inReplyTo
            ? new DecodedMessage<ContentTypes>(this.#client, reply.inReplyTo)
            : null,
        } as ContentTypes;
        break;
      }
      case DecodedMessageContentType.Custom: {
        const customContent = message.content.custom;
        if (customContent !== null) {
          const codec = this.#client.codecFor<ContentTypes>(this.contentType);
          if (codec) {
            this.content = codec.decode(customContent);
          }
        }
        break;
      }
    }
  }
}
