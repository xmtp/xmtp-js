import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, DecodedMessage } from "@xmtp/node-sdk";

/**
 * Function type for filtering messages based on content and client state.
 */
export type MessageFilter = (
  message: DecodedMessage,
  client: Client,
) => boolean | Promise<boolean>;

/**
 * Creates a filter that excludes messages from the agent itself.
 *
 * @returns Filter function
 */
function notFromSelf(): MessageFilter {
  return (message: DecodedMessage, client: Client) => {
    return message.senderInboxId !== client.inboxId;
  };
}

/**
 * Creates a filter that includes only messages from the agent itself.
 *
 * @returns Filter function
 */
function fromSelf(): MessageFilter {
  return (message: DecodedMessage, client: Client) => {
    return message.senderInboxId === client.inboxId;
  };
}

/**
 * Creates a filter that includes only text messages.
 *
 * @returns Filter function
 */
function textOnly(): MessageFilter {
  return (message: DecodedMessage) => {
    return !!message.contentType?.sameAs(ContentTypeText);
  };
}

/**
 * Creates a filter for messages from specific senders
 *
 * @param senderInboxId - Single sender ID or array of sender IDs to match
 * @returns Filter function
 */
function fromSender(senderInboxId: string | string[]): MessageFilter {
  const senderIds = Array.isArray(senderInboxId)
    ? senderInboxId
    : [senderInboxId];

  return (message: DecodedMessage) => {
    return senderIds.includes(message.senderInboxId);
  };
}

/**
 * Creates a filter that requires all provided filters to pass
 *
 * @param filters - Array of filters that must all return true
 * @returns Filter function
 */
function and(...filters: MessageFilter[]): MessageFilter {
  return async (message: DecodedMessage, client: Client) => {
    for (const filter of filters) {
      const result = await filter(message, client);
      if (!result) return false;
    }
    return true;
  };
}

/**
 * Creates a filter that requires at least one provided filter to pass.
 *
 * @param filters - Array of filters where at least one must return true
 * @returns Filter function
 */
function or(...filters: MessageFilter[]): MessageFilter {
  return async (message: DecodedMessage, client: Client) => {
    for (const filter of filters) {
      const result = await filter(message, client);
      if (result) return true;
    }
    return false;
  };
}

/**
 * Creates a filter that inverts the result of another filter.
 *
 * @param filter - The filter to negate
 * @returns Filter function
 */
function not(filter: MessageFilter): MessageFilter {
  return async (message: DecodedMessage, client: Client) => {
    const result = await filter(message, client);
    return !result;
  };
}

/**
 * Pre-configured filter instances and factory functions for common filtering scenarios
 */
export const filters = {
  // basic filters
  notFromSelf: notFromSelf(),
  fromSelf: fromSelf(),
  textOnly: textOnly(),
  // factory functions
  fromSender,
  // combinators
  and,
  or,
  not,
};
