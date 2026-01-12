import {
  contentTypeToString,
  type EncodedContent,
} from "@xmtp/content-type-primitives";
import type {
  ContentTypeId,
  DecodedMessageContent,
  DeliveryStatus,
  GroupMessageKind,
  Reaction,
  DecodedMessage as XmtpDecodedMessage,
} from "@xmtp/wasm-bindings";
import type { CodecRegistry } from "@/CodecRegistry";
import { nsToDate } from "@/utils/date";

const getContentFromDecodedMessageContent = <T = unknown>(
  content: DecodedMessageContent,
): T => {
  switch (content.type) {
    case "text": {
      return content.content as T;
    }
    case "markdown": {
      return content.content as T;
    }
    case "reply": {
      return content.content as T;
    }
    case "reaction": {
      return content.content as T;
    }
    case "attachment": {
      return content.content as T;
    }
    case "remoteAttachment": {
      return content.content as T;
    }
    case "multiRemoteAttachment": {
      return content.content as T;
    }
    case "transactionReference": {
      return content.content as T;
    }
    case "groupUpdated": {
      return content.content as T;
    }
    case "readReceipt": {
      return content.content as T;
    }
    case "leaveRequest": {
      return content.content as T;
    }
    case "walletSendCalls": {
      return content.content as T;
    }
    case "intent": {
      return content.content as T;
    }
    case "actions": {
      return content.content as T;
    }
    case "custom": {
      return content.content as T;
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
 * @property {DeliveryStatus} deliveryStatus - Current delivery status of the message ("unpublished" | "published" | "failed")
 * @property {bigint} expiresAtNs - Timestamp when the message will expire (in nanoseconds)
 * @property {Date} expiresAt - Timestamp when the message will expire
 * @property {string} fallback - Optional fallback text for the message
 * @property {string} id - Unique identifier for the message
 * @property {GroupMessageKind} kind - Type of message ("application" | "membership_change")
 * @property {bigint} numReplies - Number of replies to the message
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
  numReplies: bigint;
  reactions: DecodedMessage<Reaction>[];
  senderInboxId: string;
  sentAt: Date;
  sentAtNs: bigint;

  constructor(codecRegistry: CodecRegistry, message: XmtpDecodedMessage) {
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
      (reaction) => new DecodedMessage<Reaction>(codecRegistry, reaction),
    );

    this.content =
      getContentFromDecodedMessageContent<ContentTypes>(message.content) ??
      undefined;

    switch (message.content.type) {
      case "reply": {
        const reply = message.content.content;
        let replyContent = getContentFromDecodedMessageContent<ContentTypes>(
          reply.content,
        );
        if (reply.content.type === "custom") {
          const codec = codecRegistry.getCodec<ContentTypes>(
            reply.content.content.type as ContentTypeId,
          );
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
      case "custom": {
        const encodedContent = message.content.content;
        const codec = codecRegistry.getCodec<ContentTypes>(this.contentType);
        if (codec) {
          try {
            this.content = codec.decode(encodedContent);
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
        break;
      }
    }
  }
}
