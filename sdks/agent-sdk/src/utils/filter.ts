import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import {
  ContentTypeRemoteAttachment,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import type { MessageContext } from "@/core/MessageContext.js";

export type MessageFilter<ContentTypes> = (
  message: DecodedMessage,
  client: Client<ContentTypes>,
  conversation: Conversation,
) => boolean | Promise<boolean>;

/**
 * Creates a filter that includes only messages from the agent itself.
 *
 * @returns Filter function
 */
function fromSelf<ContentTypes>() {
  return (message: DecodedMessage, client: Client<ContentTypes>) => {
    return message.senderInboxId === client.inboxId;
  };
}

function hasDefinedContent<ContentTypes>() {
  return (
    message: DecodedMessage,
  ): message is DecodedMessage<ContentTypes> & {
    content: NonNullable<ContentTypes>;
  } => {
    return !!message.content;
  };
}

function isDM<ContentTypes>(): MessageFilter<ContentTypes> {
  return async (_message, _client, conversation) => {
    return (await conversation.metadata()).conversationType === "dm";
  };
}

function isGroup<ContentTypes>(): MessageFilter<ContentTypes> {
  return async (_message, _client, conversation) => {
    return (await conversation.metadata()).conversationType === "group";
  };
}

function isReaction() {
  return (
    message: DecodedMessage,
  ): message is DecodedMessage & { content: Reaction } => {
    return !!message.contentType?.sameAs(ContentTypeReaction);
  };
}

function isReply() {
  return (
    message: DecodedMessage,
  ): message is DecodedMessage & { content: Reply } => {
    return !!message.contentType?.sameAs(ContentTypeReply);
  };
}

function isRemoteAttachment() {
  return (
    message: DecodedMessage,
  ): message is DecodedMessage & { content: RemoteAttachment } => {
    return !!message.contentType?.sameAs(ContentTypeRemoteAttachment);
  };
}

/**
 * Creates a filter that includes only text messages.
 *
 * @returns Filter function
 */
function isText() {
  return (
    message: DecodedMessage,
  ): message is DecodedMessage & { content: string } => {
    return !!message.contentType?.sameAs(ContentTypeText);
  };
}

function isTextReply() {
  return (
    message: DecodedMessage,
  ): message is DecodedMessage & { content: Reply & { content: string } } => {
    return isReply()(message) && typeof message.content.content === "string";
  };
}

/**
 * Creates a filter for messages from specific senders
 *
 * @param senderInboxId - Single sender ID or array of sender IDs to match
 * @returns Filter function
 */
function fromSender(senderInboxId: string | string[]) {
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
function startsWith(prefix: string) {
  return (message: DecodedMessage) => {
    const getTextContent = (message: DecodedMessage) => {
      switch (true) {
        case filter.isReaction(message):
        case filter.isTextReply(message):
          return message.content.content;
        case filter.isText(message):
          return message.content;
      }
    };

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
  return async (message, client, conversation) => {
    for (const filter of filters) {
      const result = await filter(message, client, conversation);
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
  return async (message, client, conversation) => {
    for (const filter of filters) {
      const result = await filter(message, client, conversation);
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
  return async (message, client, conversation) => {
    return !(await filter(message, client, conversation));
  };
}

/**
 * Pre-configured filter instances and factory functions for common filtering scenarios
 */
export const filter = {
  // basic filters
  fromSelf: fromSelf(),
  hasDefinedContent: hasDefinedContent(),
  isDM: isDM(),
  isGroup: isGroup(),
  isReaction: isReaction(),
  isRemoteAttachment: isRemoteAttachment(),
  isReply: isReply(),
  isText: isText(),
  isTextReply: isTextReply(),
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
    filterFn: MessageFilter<ContentTypes>,
    listener: (ctx: MessageContext<ContentTypes>) => void | Promise<void>,
  ) =>
  async (ctx: MessageContext<ContentTypes>) => {
    if (await filterFn(ctx.message, ctx.client, ctx.conversation)) {
      await listener(ctx);
    }
  };
