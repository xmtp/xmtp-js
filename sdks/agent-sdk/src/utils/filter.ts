import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, DecodedMessage } from "@xmtp/node-sdk";
import type { AgentContext } from "@/core/MessageContext.js";
import { getTextContent } from "./message.js";

/**
 * Function type for filtering messages based on content and client state.
 */
export type MessageFilter<ContentTypes> = (
  message: DecodedMessage,
  client: Client<ContentTypes>,
) => boolean;

/**
 * Creates a filter that excludes messages from the agent itself.
 *
 * @returns Filter function
 */
function notFromSelf<ContentTypes>(): MessageFilter<ContentTypes> {
  return (message: DecodedMessage, client: Client<ContentTypes>) => {
    return message.senderInboxId !== client.inboxId;
  };
}

/**
 * Creates a filter that includes only messages from the agent itself.
 *
 * @returns Filter function
 */
function fromSelf<ContentTypes>(): MessageFilter<ContentTypes> {
  return (message: DecodedMessage, client: Client<ContentTypes>) => {
    return message.senderInboxId === client.inboxId;
  };
}

/**
 * Creates a filter that includes only text messages.
 *
 * @returns Filter function
 */
function isText<ContentTypes>(): MessageFilter<ContentTypes> {
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
function fromSender<ContentTypes>(
  senderInboxId: string | string[],
): MessageFilter<ContentTypes> {
  const senderIds = Array.isArray(senderInboxId)
    ? senderInboxId
    : [senderInboxId];

  return (message: DecodedMessage) => {
    return senderIds.includes(message.senderInboxId);
  };
}

/**
 * Creates a filter that matches text messages starting with a specific string.
 *
 * @param prefix - The string prefix to match against
 * @returns Filter function
 */
function startsWith<ContentTypes>(prefix: string): MessageFilter<ContentTypes> {
  return (message: DecodedMessage) => {
    const text = getTextContent(message);
    return !!(text && text.startsWith(prefix));
  };
}

/**
 * Creates a filter that requires all provided filters to pass
 *
 * @param filters - Array of filters that must all return true
 * @returns Filter function
 */
function and<ContentTypes>(
  ...filters: MessageFilter<ContentTypes>[]
): MessageFilter<ContentTypes> {
  return (message: DecodedMessage, client: Client<ContentTypes>) => {
    for (const filter of filters) {
      const result = filter(message, client);
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
function or<ContentTypes>(
  ...filters: MessageFilter<ContentTypes>[]
): MessageFilter<ContentTypes> {
  return (message: DecodedMessage, client: Client<ContentTypes>) => {
    for (const filter of filters) {
      const result = filter(message, client);
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
function not<ContentTypes>(
  filter: MessageFilter<ContentTypes>,
): MessageFilter<ContentTypes> {
  return (message: DecodedMessage, client: Client<ContentTypes>) => {
    return !filter(message, client);
  };
}

/**
 * Pre-configured filter instances and factory functions for common filtering scenarios
 */
export const filter = {
  // basic filters
  notFromSelf: notFromSelf(),
  fromSelf: fromSelf(),
  isText: isText(),
  // factory functions
  fromSender,
  startsWith,
  // combinators
  and,
  or,
  not,
};

export const f = filter;

export const withFilter =
  <ContentTypes>(
    filter: MessageFilter<ContentTypes>,
    listener: (ctx: AgentContext<ContentTypes>) => void,
  ) =>
  (ctx: AgentContext<ContentTypes>) => {
    if (filter(ctx.message, ctx.client)) {
      listener(ctx);
    }
  };
