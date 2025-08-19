import { Client, DecodedMessage } from "@xmtp/node-sdk";

export type MessageFilter = (
  message: DecodedMessage,
  client: Client,
) => boolean | Promise<boolean>;

class MessageFilters {
  static notFromSelf(): MessageFilter {
    return (message: DecodedMessage, client: Client) => {
      return (
        message.senderInboxId.toLowerCase() !== client.inboxId.toLowerCase()
      );
    };
  }

  static fromSelf(): MessageFilter {
    return (message: DecodedMessage, client: Client) => {
      return (
        message.senderInboxId.toLowerCase() === client.inboxId.toLowerCase()
      );
    };
  }

  static textOnly(): MessageFilter {
    return (message: DecodedMessage) => {
      return message.contentType?.typeId === "text";
    };
  }

  static contentType(typeId: string): MessageFilter {
    return (message: DecodedMessage) => {
      return message.contentType?.typeId === typeId;
    };
  }

  static fromSender(senderInboxId: string | string[]): MessageFilter {
    const senders = Array.isArray(senderInboxId)
      ? senderInboxId
      : [senderInboxId];
    const normalizedSenders = senders.map((sender) => sender.toLowerCase());

    return (message: DecodedMessage) => {
      return normalizedSenders.includes(message.senderInboxId.toLowerCase());
    };
  }

  static and(...filters: MessageFilter[]): MessageFilter {
    return async (message: DecodedMessage, client: Client) => {
      for (const filter of filters) {
        const result = await filter(message, client);
        if (!result) return false;
      }
      return true;
    };
  }

  static or(...filters: MessageFilter[]): MessageFilter {
    return async (message: DecodedMessage, client: Client) => {
      for (const filter of filters) {
        const result = await filter(message, client);
        if (result) return true;
      }
      return false;
    };
  }

  static not(filter: MessageFilter): MessageFilter {
    return async (message: DecodedMessage, client: Client) => {
      const result = await filter(message, client);
      return !result;
    };
  }
}

export const filters = {
  // Basic filters
  notFromSelf: MessageFilters.notFromSelf(),
  fromSelf: MessageFilters.fromSelf(),
  textOnly: MessageFilters.textOnly(),
  // Factory functions
  contentType: MessageFilters.contentType,
  fromSender: MessageFilters.fromSender,
  // Combinators
  and: MessageFilters.and,
  or: MessageFilters.or,
  not: MessageFilters.not,
};
