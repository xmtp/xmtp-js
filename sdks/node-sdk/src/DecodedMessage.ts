import {
  DecodedMessageContentType,
  DeliveryStatus,
  GroupMessageKind,
  type ContentTypeId,
  type DecodedMessage as XmtpDecodedMessage,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { nsToDate } from "@/utils/date";

export type MessageKind = "application" | "membership_change";
export type MessageDeliveryStatus = "unpublished" | "published" | "failed";

/**
 * Represents a decoded XMTP message
 *
 * @class
 * @property {unknown} content - The decoded content of the message
 * @property {ContentTypeId} contentType - The content type of the message content
 * @property {string} conversationId - Unique identifier for the conversation
 * @property {MessageDeliveryStatus} deliveryStatus - Current delivery status of the message ("unpublished" | "published" | "failed")
 * @property {string} [fallback] - Optional fallback text for the message
 * @property {string} id - Unique identifier for the message
 * @property {MessageKind} kind - Type of message ("application" | "membership_change")
 * @property {string} senderInboxId - Identifier for the sender's inbox
 * @property {Date} sentAt - Timestamp when the message was sent
 * @property {number} sentAtNs - Timestamp when the message was sent (in nanoseconds)
 */
export class DecodedMessage<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  content: ContentTypes | undefined;
  contentType: ContentTypeId;
  conversationId: string;
  deliveryStatus: MessageDeliveryStatus;
  fallback?: string;
  id: string;
  kind: MessageKind;
  senderInboxId: string;
  sentAt: Date;
  sentAtNs: number;

  constructor(client: Client<ContentTypes>, message: XmtpDecodedMessage) {
    this.#client = client;
    this.id = message.id;
    this.sentAtNs = message.sentAtNs;
    this.sentAt = nsToDate(message.sentAtNs);
    this.conversationId = message.conversationId;
    this.senderInboxId = message.senderInboxId;
    this.contentType = message.contentType;
    this.fallback = message.fallback;

    switch (message.kind) {
      case GroupMessageKind.Application:
        this.kind = "application";
        break;
      case GroupMessageKind.MembershipChange:
        this.kind = "membership_change";
        break;
      // no default
    }

    switch (message.deliveryStatus) {
      case DeliveryStatus.Unpublished:
        this.deliveryStatus = "unpublished";
        break;
      case DeliveryStatus.Published:
        this.deliveryStatus = "published";
        break;
      case DeliveryStatus.Failed:
        this.deliveryStatus = "failed";
        break;
      // no default
    }

    this.content = undefined;

    switch (message.content.type) {
      case DecodedMessageContentType.Text: {
        this.content = message.content.text as ContentTypes;
        break;
      }
      case DecodedMessageContentType.Markdown: {
        this.content = message.content.markdown as ContentTypes;
        break;
      }
      case DecodedMessageContentType.Reply: {
        this.content = message.content.reply as ContentTypes;
        break;
      }
      case DecodedMessageContentType.Reaction: {
        this.content = message.content.reaction as ContentTypes;
        break;
      }
      case DecodedMessageContentType.Attachment: {
        this.content = message.content.attachment as ContentTypes;
        break;
      }
      case DecodedMessageContentType.RemoteAttachment: {
        this.content = message.content.remoteAttachment as ContentTypes;
        break;
      }
      case DecodedMessageContentType.MultiRemoteAttachment: {
        this.content = message.content.multiRemoteAttachment as ContentTypes;
        break;
      }
      case DecodedMessageContentType.TransactionReference: {
        this.content = message.content.transactionReference as ContentTypes;
        break;
      }
      case DecodedMessageContentType.GroupUpdated: {
        this.content = message.content.groupUpdated as ContentTypes;
        break;
      }
      case DecodedMessageContentType.ReadReceipt: {
        this.content = message.content.readReceipt as ContentTypes;
        break;
      }
      case DecodedMessageContentType.LeaveRequest: {
        this.content = message.content.leaveRequest as ContentTypes;
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
