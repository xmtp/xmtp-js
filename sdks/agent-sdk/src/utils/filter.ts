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
import {
  Dm,
  Group,
  type Client,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/node-sdk";
import type { MessageContext } from "@/core/MessageContext.js";

export interface FilterContext<ContentTypes = unknown> {
  message: DecodedMessage;
  client: Client<ContentTypes>;
  conversation: Conversation;
}

export type MessageFilter<ContentTypes = unknown> = (
  context: FilterContext<ContentTypes>,
) => boolean | Promise<boolean>;

/**
 * Creates a filter that includes only messages from the agent itself.
 *
 * @returns Filter function
 */
function fromSelf<ContentTypes>() {
  return ({
    message,
    client,
  }: Pick<FilterContext<ContentTypes>, "message" | "client">) => {
    return message.senderInboxId === client.inboxId;
  };
}

function hasDefinedContent<ContentTypes>() {
  return (
    ctx: Pick<FilterContext<ContentTypes>, "message">,
  ): ctx is Pick<FilterContext<ContentTypes>, "message"> & {
    message: DecodedMessage<ContentTypes> & {
      content: NonNullable<ContentTypes>;
    };
  } => {
    return !!ctx.message.content;
  };
}

function isDM<ContentTypes>() {
  return (
    ctx: Pick<FilterContext<ContentTypes>, "conversation">,
  ): ctx is FilterContext<ContentTypes> & {
    conversation: Dm<ContentTypes>;
  } => {
    return ctx.conversation instanceof Dm;
  };
}

function isGroup<ContentTypes>() {
  return (
    ctx: Pick<FilterContext<ContentTypes>, "conversation">,
  ): ctx is FilterContext<ContentTypes> & {
    conversation: Group<ContentTypes>;
  } => {
    return ctx.conversation instanceof Group;
  };
}

function isGroupAdmin<ContentTypes>(): MessageFilter<ContentTypes> {
  return ({
    message,
    conversation,
  }: Pick<FilterContext<ContentTypes>, "message" | "conversation">) => {
    const groupCheck = { conversation };
    if (isGroup()(groupCheck)) {
      return groupCheck.conversation.isAdmin(message.senderInboxId);
    }
    return false;
  };
}

function isGroupSuperAdmin<ContentTypes>(): MessageFilter<ContentTypes> {
  return ({
    message,
    conversation,
  }: Pick<FilterContext<ContentTypes>, "message" | "conversation">) => {
    const groupCheck = { conversation };
    if (isGroup()(groupCheck)) {
      return groupCheck.conversation.isSuperAdmin(message.senderInboxId);
    }
    return false;
  };
}

function isReaction() {
  return (
    ctx: Pick<FilterContext, "message">,
  ): ctx is FilterContext & {
    message: DecodedMessage & { content: Reaction };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeReaction);
  };
}

function isReply() {
  return (
    ctx: Pick<FilterContext, "message">,
  ): ctx is FilterContext & {
    message: DecodedMessage & { content: Reply };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeReply);
  };
}

function isRemoteAttachment() {
  return (
    ctx: Pick<FilterContext, "message">,
  ): ctx is FilterContext & {
    message: DecodedMessage & { content: RemoteAttachment };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeRemoteAttachment);
  };
}

/**
 * Creates a filter that includes only text messages.
 *
 * @returns Filter function
 */
function isText() {
  return (
    ctx: Pick<FilterContext, "message">,
  ): ctx is FilterContext & {
    message: DecodedMessage & { content: string };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeText);
  };
}

function isTextReply() {
  return (
    ctx: Pick<FilterContext, "message">,
  ): ctx is FilterContext & {
    message: DecodedMessage & { content: Reply & { content: string } };
  } => {
    const typedContext = { message: ctx.message };
    return (
      isReply()(typedContext) &&
      typeof typedContext.message.content === "string"
    );
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

  return ({ message }: Pick<FilterContext, "message">) => {
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
  return ({ message }: Pick<FilterContext, "message">) => {
    const getTextContent = (message: DecodedMessage) => {
      const msgContext = { message };

      if (filter.isReaction(msgContext)) {
        return msgContext.message.content;
      }
      if (filter.isTextReply(msgContext)) {
        return msgContext.message.content;
      }
      if (filter.isText(msgContext)) {
        return msgContext.message.content;
      }

      return undefined;
    };

    const text = getTextContent(message);
    return !!(text && typeof text === "string" && text.startsWith(prefix));
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
  return async (context: FilterContext<ContentTypes>) => {
    for (const filter of filters) {
      const result = await filter(context);
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
  return async (context: FilterContext<ContentTypes>) => {
    for (const filter of filters) {
      const result = await filter(context);
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
  return async (context: FilterContext<ContentTypes>) => {
    return !(await filter(context));
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
  isGroupAdmin: isGroupAdmin(),
  isGroupSuperAdmin: isGroupSuperAdmin(),
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
    if (
      await filterFn({
        message: ctx.message,
        client: ctx.client,
        conversation: ctx.conversation,
      })
    ) {
      await listener(ctx);
    }
  };
