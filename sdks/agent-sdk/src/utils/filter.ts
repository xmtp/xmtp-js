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
import { Dm, Group, type DecodedMessage } from "@xmtp/node-sdk";
import type { AgentBaseContext } from "@/core/AgentContext.js";
import type { MessageContext } from "@/core/MessageContext.js";

export type MessageFilter<ContentTypes = unknown> = (
  context: AgentBaseContext<ContentTypes>,
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
  }: Pick<AgentBaseContext<ContentTypes>, "message" | "client">) => {
    return message.senderInboxId === client.inboxId;
  };
}

function hasDefinedContent<ContentTypes>() {
  return (
    ctx: Pick<AgentBaseContext<ContentTypes>, "message">,
  ): ctx is Pick<AgentBaseContext<ContentTypes>, "message"> & {
    message: DecodedMessage<ContentTypes> & {
      content: NonNullable<ContentTypes>;
    };
  } => {
    return ctx.message.content !== undefined && ctx.message.content !== null;
  };
}

function isDM<ContentTypes>() {
  return (
    ctx: Pick<AgentBaseContext<ContentTypes>, "conversation">,
  ): ctx is Pick<AgentBaseContext<ContentTypes>, "conversation"> & {
    conversation: Dm<ContentTypes>;
  } => {
    return ctx.conversation instanceof Dm;
  };
}

function isGroup<ContentTypes>() {
  return (
    ctx: Pick<AgentBaseContext<ContentTypes>, "conversation">,
  ): ctx is Pick<AgentBaseContext<ContentTypes>, "conversation"> & {
    conversation: Group<ContentTypes>;
  } => {
    return ctx.conversation instanceof Group;
  };
}

function isGroupAdmin<ContentTypes>(): MessageFilter<ContentTypes> {
  return ({
    message,
    conversation,
  }: Pick<AgentBaseContext<ContentTypes>, "message" | "conversation">) => {
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
  }: Pick<AgentBaseContext<ContentTypes>, "message" | "conversation">) => {
    const groupCheck = { conversation };
    if (isGroup()(groupCheck)) {
      return groupCheck.conversation.isSuperAdmin(message.senderInboxId);
    }
    return false;
  };
}

function isReaction() {
  return (
    ctx: Pick<AgentBaseContext, "message">,
  ): ctx is AgentBaseContext & {
    message: DecodedMessage & { content: Reaction };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeReaction);
  };
}

function isReply() {
  return (
    ctx: Pick<AgentBaseContext, "message">,
  ): ctx is AgentBaseContext & {
    message: DecodedMessage & { content: Reply };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeReply);
  };
}

function isRemoteAttachment() {
  return (
    ctx: Pick<AgentBaseContext, "message">,
  ): ctx is AgentBaseContext & {
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
    ctx: Pick<AgentBaseContext, "message">,
  ): ctx is AgentBaseContext & {
    message: DecodedMessage & { content: string };
  } => {
    return !!ctx.message.contentType?.sameAs(ContentTypeText);
  };
}

function isTextReply() {
  return (
    ctx: Pick<AgentBaseContext, "message">,
  ): ctx is AgentBaseContext & {
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

  return ({ message }: Pick<AgentBaseContext, "message">) => {
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
  return ({ message }: Pick<AgentBaseContext, "message">) => {
    const getTextContent = (message: DecodedMessage) => {
      const msgContext = { message };

      if (isReaction()(msgContext)) {
        return msgContext.message.content.content;
      }
      if (isReply()(msgContext)) {
        return msgContext.message.content.content;
      }
      if (isText()(msgContext)) {
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
  return async (context: AgentBaseContext<ContentTypes>) => {
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
  return async (context: AgentBaseContext<ContentTypes>) => {
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
  return async (context: AgentBaseContext<ContentTypes>) => {
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
