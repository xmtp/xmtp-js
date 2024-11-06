import { ContentTypeId } from "@xmtp/content-type-primitives";
import {
  DeliveryStatus,
  GroupMessageKind,
  type Message,
} from "@xmtp/node-bindings";
import type { Client } from "@/Client";
import { nsToDate } from "@/helpers/date";

export type MessageKind = "application" | "membership_change";
export type MessageDeliveryStatus = "unpublished" | "published" | "failed";

export class DecodedMessage<T = any> {
  #client: Client;
  content: T;
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

  constructor(client: Client, message: Message) {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.content = this.contentType
      ? this.#client.decodeContent(message, this.contentType)
      : undefined;
  }
}
