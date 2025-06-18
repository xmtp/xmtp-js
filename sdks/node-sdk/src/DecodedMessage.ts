import { ContentTypeId } from "@xmtp/content-type-primitives";
import {
  DeliveryStatus,
  GroupMessageKind,
  type Message,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { nsToDate } from "@/utils/date";

export type MessageKind = "application" | "membership_change";
export type MessageDeliveryStatus = "unpublished" | "published" | "failed";

/**
 * Represents a decoded XMTP message
 *
 * This class transforms network messages into a structured format with
 * content decoding.
 *
 * @class
 * @property {any} content - The decoded content of the message
 * @property {ContentTypeId} contentType - The content type of the message content
 * @property {string} conversationId - Unique identifier for the conversation
 * @property {MessageDeliveryStatus} deliveryStatus - Current delivery status of the message ("unpublished" | "published" | "failed")
 * @property {string} [fallback] - Optional fallback text for the message
 * @property {number} [compression] - Optional compression level applied to the message
 * @property {string} id - Unique identifier for the message
 * @property {MessageKind} kind - Type of message ("application" | "membership_change")
 * @property {Record<string, string>} parameters - Additional parameters associated with the message
 * @property {string} senderInboxId - Identifier for the sender's inbox
 * @property {Date} sentAt - Timestamp when the message was sent
 * @property {number} sentAtNs - Timestamp when the message was sent (in nanoseconds)
 */
export class DecodedMessage<ContentTypes = unknown> {
  #client: Client<ContentTypes>;
  content: ContentTypes | undefined;
  contentType: ContentTypeId | undefined;
  conversationId: string;
  deliveryStatus: MessageDeliveryStatus;
  fallback?: string;
  compression?: number;
  id: string;
  kind: MessageKind;
  parameters: Record<string, string>;
  senderInboxId: string;
  sentAt: Date;
  sentAtNs: number;

  constructor(client: Client<ContentTypes>, message: Message) {
    this.#client = client;
    this.id = message.id;
    this.sentAtNs = message.sentAtNs;
    this.sentAt = nsToDate(message.sentAtNs);
    this.conversationId = message.convoId;
    this.senderInboxId = message.senderInboxId;

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

    this.contentType = message.content.type
      ? new ContentTypeId(message.content.type)
      : undefined;
    this.parameters = message.content.parameters;
    this.fallback = message.content.fallback;
    this.compression = message.content.compression;
    this.content = undefined;

    if (this.contentType) {
      try {
        this.content = this.#client.decodeContent<ContentTypes>(
          message,
          this.contentType,
        );
      } catch {
        this.content = undefined;
      }
    }
  }
}
