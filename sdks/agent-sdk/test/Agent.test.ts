import {
  encodeText,
  ReactionAction,
  ReactionSchema,
  type BuiltInContentTypes,
  type Client,
  type Dm,
  type Group,
  type GroupUpdated,
  type Reaction,
  type RemoteAttachment,
  type Reply,
} from "@xmtp/node-sdk";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  Agent,
  type AgentErrorMiddleware,
  type AgentMiddleware,
} from "@/core/Agent.js";
import type { ClientContext } from "@/core/ClientContext.js";
import { ConversationContext } from "@/core/ConversationContext.js";
import { filter } from "@/core/filter.js";
import { MessageContext } from "@/core/MessageContext.js";
import { createClient, sleep } from "@test/helpers.js";

describe("Agent", () => {
  let agent: Agent<BuiltInContentTypes>;
  let client: Client;

  beforeEach(async () => {
    client = await createClient();
    agent = new Agent({
      client,
    });
  });

  describe("types", () => {
    it("infers additional content types from given codecs", () => {
      expectTypeOf(agent).toEqualTypeOf<Agent<BuiltInContentTypes>>();
    });

    it("types the content in message event listener", () => {
      agent.on("unknownMessage", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<
          MessageContext<unknown, BuiltInContentTypes>
        >();
      });
    });

    it("types content for 'attachment' events", () => {
      agent.on("attachment", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<RemoteAttachment>();
      });
    });

    it("types content for 'text' events", () => {
      agent.on("text", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<string>();
      });
    });

    it("types content for 'reaction' events", () => {
      agent.on("reaction", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<Reaction>();
      });
    });

    it("types content for 'reply' events", () => {
      agent.on("reply", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<Reply>();
      });
    });

    it("types content for 'group-update' events", () => {
      agent.on("group-update", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<GroupUpdated>();
      });
    });

    it("should have proper types when using type predicates in 'unknownMessage' event", () => {
      agent.on("unknownMessage", (ctx) => {
        if (ctx.isText()) {
          expectTypeOf(ctx.message.content).toEqualTypeOf<string>();
        }

        if (ctx.isReply()) {
          expectTypeOf(ctx.message.content).toEqualTypeOf<Reply>();
        }

        if (ctx.isReaction()) {
          expectTypeOf(ctx.message.content).toEqualTypeOf<Reaction>();
        }

        if (ctx.isRemoteAttachment()) {
          expectTypeOf(ctx.message.content).toEqualTypeOf<RemoteAttachment>();
        }
      });
    });

    it("should have proper types when using type predicates in 'conversation' event", () => {
      agent.on("conversation", (ctx) => {
        if (ctx.isDm()) {
          expectTypeOf(ctx.conversation).toEqualTypeOf<
            Dm<BuiltInContentTypes>
          >();
        }

        if (ctx.isGroup()) {
          expectTypeOf(ctx.conversation).toEqualTypeOf<
            Group<BuiltInContentTypes>
          >();
        }
      });
    });

    it("types content for 'start' events", () => {
      agent.on("start", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<ClientContext<BuiltInContentTypes>>();
      });
    });

    it("types content for 'stop' events", () => {
      agent.on("stop", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<ClientContext<BuiltInContentTypes>>();
      });
    });
  });

  describe("start", () => {
    it("should sync conversations and start listening", async () => {
      const startSpy = vi.fn();
      agent.on("start", startSpy);
      await agent.start();
      expect(startSpy).toHaveBeenCalled();
    });

    it("should not start twice if already listening", async () => {
      const startSpy = vi.fn();
      agent.on("start", startSpy);
      await agent.start();
      await agent.start(); // second call should return early
      expect(startSpy).toHaveBeenCalledTimes(1);
    });

    it("should filter messages from the agent itself (same senderInboxId)", async () => {
      const textEventSpy = vi.fn();
      const unknownMessageSpy = vi.fn();
      agent.on("text", textEventSpy);
      agent.on("unknownMessage", unknownMessageSpy);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");
      const messages = await dm.messages();
      const message = messages[1]!;

      await sleep(1000);

      expect(
        textEventSpy,
        "Should not emit events for message from self, but should for message from other",
      ).toHaveBeenCalledTimes(1);
      expect(
        unknownMessageSpy,
        "Filtered text messages don't go to unknownMessage",
      ).toHaveBeenCalledTimes(0);

      expect(textEventSpy).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: dm,
          client: otherClient,
        }),
      );
    });

    it("should filter reaction messages from the agent itself", async () => {
      const reactionEventSpy = vi.fn();
      const unknownMessageSpy = vi.fn();
      agent.on("reaction", reactionEventSpy);
      agent.on("unknownMessage", unknownMessageSpy);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);

      await agent.client.conversations.sync();
      const agentDm = (await agent.client.conversations.getConversationById(
        dm.id,
      )) as Dm<BuiltInContentTypes>;
      const messageId = await agentDm.sendText("gm");

      await agentDm.sendReaction({
        action: ReactionAction.Added,
        schema: ReactionSchema.Unicode,
        content: "👍",
        reference: messageId,
        referenceInboxId: client.inboxId,
      });

      const reactionId = await dm.sendReaction({
        action: ReactionAction.Added,
        schema: ReactionSchema.Unicode,
        content: "👍",
        reference: messageId,
        referenceInboxId: client.inboxId,
      });
      const reaction = agent.client.conversations.getMessageById(reactionId)!;

      await sleep(1000);

      expect(
        reactionEventSpy,
        "Should only emit reaction event for message from other sender",
      ).toHaveBeenCalledTimes(1);
      expect(
        unknownMessageSpy,
        "Filtered text messages don't go to unknownMessage",
      ).toHaveBeenCalledTimes(0);

      expect(reactionEventSpy).toHaveBeenCalledWith(
        new MessageContext({
          message: reaction,
          conversation: dm,
          client: otherClient,
        }),
      );
    });

    it("should emit 'group-update' events for group update messages", async () => {
      const groupUpdateEventSpy = vi.fn();
      agent.on("group-update", groupUpdateEventSpy);

      await agent.start();

      const otherClient = await createClient();
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);
      await group.addAdmin(client.inboxId);
      const messages = await group.messages();
      const message = messages[1]!;

      await sleep(1000);

      expect(groupUpdateEventSpy).toHaveBeenCalledTimes(1);
      expect(groupUpdateEventSpy).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: group,
          client: otherClient,
        }),
      );
    });

    it("should emit generic 'message' event for all message types", async () => {
      const messageEventSpy = vi.fn();
      const textEventSpy = vi.fn();
      const reactionEventSpy = vi.fn();
      const replyEventSpy = vi.fn();
      const groupUpdateEventSpy = vi.fn();

      agent.on("message", messageEventSpy);
      agent.on("text", textEventSpy);
      agent.on("reaction", reactionEventSpy);
      agent.on("reply", replyEventSpy);
      agent.on("group-update", groupUpdateEventSpy);

      await agent.start();

      const otherClient = await createClient();
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);
      await group.addAdmin(client.inboxId);
      const messageId = await group.sendText("gm");
      await group.sendReaction({
        action: ReactionAction.Added,
        schema: ReactionSchema.Unicode,
        content: "👍",
        reference: messageId,
        referenceInboxId: client.inboxId,
      });
      await group.sendReply({
        content: encodeText("gm"),
        reference: messageId,
        referenceInboxId: client.inboxId,
      });

      await sleep(1000);

      expect(
        messageEventSpy,
        "Generic 'message' event should fire for all message types",
      ).toHaveBeenCalledTimes(4);
      expect(textEventSpy).toHaveBeenCalledTimes(1);
      expect(reactionEventSpy).toHaveBeenCalledTimes(1);
      expect(replyEventSpy).toHaveBeenCalledTimes(1);
      expect(groupUpdateEventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("conversation events", () => {
    it("should emit 'conversation' events for new conversations", async () => {
      const conversationEventSpy = vi.fn();
      agent.on("conversation", conversationEventSpy);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);

      await sleep(1000);

      expect(conversationEventSpy).toHaveBeenCalledTimes(2);
      expect(conversationEventSpy).toHaveBeenNthCalledWith(
        1,
        new ConversationContext({
          conversation: dm,
          client: otherClient,
        }),
      );
      expect(conversationEventSpy).toHaveBeenNthCalledWith(
        2,
        new ConversationContext({
          conversation: group,
          client: otherClient,
        }),
      );
    });

    it("should emit specific 'dm' events for direct messages", async () => {
      const dmEventSpy = vi.fn();
      const conversationEventSpy = vi.fn();
      agent.on("dm", dmEventSpy);
      agent.on("conversation", conversationEventSpy);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);

      await sleep(1000);

      expect(dmEventSpy).toHaveBeenCalledTimes(1);
      expect(conversationEventSpy).toHaveBeenCalledTimes(1);

      expect(dmEventSpy).toHaveBeenCalledWith(
        new ConversationContext({
          conversation: dm,
          client: otherClient,
        }),
      );
    });

    it("should emit specific 'group' events for Group conversations", async () => {
      const groupEventSpy = vi.fn();
      const conversationEventSpy = vi.fn();
      agent.on("group", groupEventSpy);
      agent.on("conversation", conversationEventSpy);

      await agent.start();

      const otherClient = await createClient();
      const group = await otherClient.conversations.createGroup([
        client.inboxId,
      ]);

      await sleep(1000);

      expect(groupEventSpy).toHaveBeenCalledTimes(1);
      expect(conversationEventSpy).toHaveBeenCalledTimes(1);

      expect(groupEventSpy).toHaveBeenCalledWith(
        new ConversationContext({
          conversation: group,
          client: otherClient,
        }),
      );
    });
  });

  describe("use", () => {
    it("should add middleware and return the agent instance", () => {
      const middleware = vi.fn();
      const result = agent.use(middleware);
      expect(result).toBe(agent);
    });

    it("should execute middleware when processing messages", async () => {
      const middleware = vi.fn<AgentMiddleware>(async (_, next) => {
        await next();
      });
      agent.use(middleware);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");
      const messages = await dm.messages();
      const message = messages[1]!;

      await sleep(1000);

      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: dm,
          client: otherClient,
        }),
        expect.any(Function),
      );
    });

    it("should filter self messages before they reach middleware", async () => {
      const middlewareCallsSpy = vi.fn<AgentMiddleware>(async (_, next) => {
        await next();
      });
      agent.use(middlewareCallsSpy);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");
      const messages = await dm.messages();
      const message = messages[1]!;

      await sleep(1000);

      // Middleware should only be called once (for the message from other user)
      expect(
        middlewareCallsSpy,
        "Middleware should only process messages from other users, not self",
      ).toHaveBeenCalledTimes(1);

      // Verify middleware was called with the message from the other user
      expect(middlewareCallsSpy).toHaveBeenCalledWith(
        new MessageContext({
          message,
          conversation: dm,
          client: otherClient,
        }),
        expect.any(Function),
      );
    });

    it("should continue to next middleware when next() is called", async () => {
      const middlewareCalls: string[] = [];

      const mw1 = vi.fn<AgentMiddleware>(async (ctx, next) => {
        middlewareCalls.push("mw1-" + ctx.message.id);
        await next();
      });

      const mw2 = vi.fn<AgentMiddleware>(async (ctx, next) => {
        middlewareCalls.push("mw2-" + ctx.message.id);
        await next();
      });

      const mw3 = vi.fn<AgentMiddleware>(async (ctx, next) => {
        middlewareCalls.push("mw3-" + ctx.message.id);
        await next();
      });

      agent.use([mw1, mw2, mw3]);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      const messageId1 = await dm.sendText("Hello world");
      const messageId2 = await dm.sendText("Hello world");

      await sleep(1000);

      expect(middlewareCalls).toEqual([
        `mw1-${messageId1}`,
        `mw2-${messageId1}`,
        `mw3-${messageId1}`,
        `mw1-${messageId2}`,
        `mw2-${messageId2}`,
        `mw3-${messageId2}`,
      ]);
    });

    it("should stop the processing chain when the middleware returns", async () => {
      const middlewareCalls: string[] = [];

      const mw1 = vi.fn<AgentMiddleware>(async (ctx, next) => {
        middlewareCalls.push("mw1-" + ctx.message.id);
        await next();
      });

      const filterReply = vi.fn<AgentMiddleware>(async ({ message }, next) => {
        middlewareCalls.push("filterReply-" + message.id);
        if (filter.isReply(message)) {
          return;
        }
        await next();
      });

      const mw3 = vi.fn<AgentMiddleware>(async (ctx, next) => {
        middlewareCalls.push("mw3-" + ctx.message.id);
        await next();
      });

      agent.use([mw1, filterReply, mw3]);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      const messageId1 = await dm.sendText("Hello world");
      const messageId2 = await dm.sendReply({
        content: encodeText("Hello world"),
        reference: messageId1,
        referenceInboxId: client.inboxId,
      });

      await sleep(1000);

      expect(middlewareCalls).toEqual([
        `mw1-${messageId1}`,
        `filterReply-${messageId1}`,
        `mw3-${messageId1}`,
        `mw1-${messageId2}`,
        `filterReply-${messageId2}`,
      ]);
    });
  });

  describe("emit", () => {
    it("should emit 'text' and allow sending a reply via context", async () => {
      const handler = vi.fn(async (ctx: MessageContext) => {
        await ctx.conversation.sendText("gm");
      });

      agent.on("text", handler);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");

      await sleep(1000);

      expect(handler).toHaveBeenCalledTimes(1);

      await sleep(1000);

      await dm.sync();
      const messages = await dm.messages();
      const message = messages[2]!;
      expect(message.senderInboxId).toBe(client.inboxId);
      expect(message.content).toBe("gm");
    });
  });

  describe("stop", () => {
    it("should stop listening and emit stop event", async () => {
      const stopSpy = vi.fn();
      agent.on("stop", stopSpy);

      await agent.start();
      await agent.stop();

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe("errors.use", () => {
    it("propagates error, transforms, recovers, and resumes remaining middleware", async () => {
      const callOrder: string[] = [];
      const onError = vi.fn();
      agent.on("unhandledError", onError);

      const mw1: AgentMiddleware = async (ctx, next) => {
        expect(ctx).toBeInstanceOf(MessageContext);
        callOrder.push("1");
        await next();
      };

      const mw2: AgentMiddleware = (ctx) => {
        expect(ctx).toBeInstanceOf(MessageContext);
        callOrder.push("2");
        throw new Error("Initial error");
      };

      const mw3: AgentMiddleware = async (ctx, next) => {
        expect(ctx).toBeInstanceOf(MessageContext);
        callOrder.push("3");
        await next();
      };

      const mw4: AgentMiddleware = async (ctx, next) => {
        expect(ctx).toBeInstanceOf(MessageContext);
        callOrder.push("4");
        await next();
      };

      const e1: AgentErrorMiddleware = async (err, ctx, next) => {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe("Initial error");
        expect(ctx).toBeInstanceOf(MessageContext);
        callOrder.push("E1");
        // Transform the initial error
        await next(new Error("Transformed error"));
      };

      const e2: AgentErrorMiddleware = async (err, ctx, next) => {
        expect((err as Error).message).toBe("Transformed error");
        expect(ctx).toBeInstanceOf(MessageContext);
        callOrder.push("E2");
        // Resume middleware chain
        await next();
      };

      agent.use([mw1, mw2], [mw3], mw4);
      agent.errors.use(e1, e2);

      agent.on("text", () => {
        callOrder.push("EMIT");
      });

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");

      await sleep(1000);

      expect(callOrder).toEqual(["1", "2", "E1", "E2", "3", "4", "EMIT"]);
      expect(
        onError,
        "error chain recovered, no final error is emitted",
      ).toHaveBeenCalledTimes(0);
    });

    it("doesn't emit when a middleware returns early", async () => {
      const callOrder: string[] = [];

      const mw1: AgentMiddleware = async (_, next) => {
        callOrder.push("1");
        await next();
      };

      const mw2: AgentMiddleware = async (_, next) => {
        callOrder.push("2");
        await next();
      };

      const returnsEarly: AgentMiddleware = () => {
        return Promise.resolve();
      };

      const notBeingExecuted: AgentMiddleware = async (_, next) => {
        callOrder.push("4");
        await next();
      };

      agent.use(mw1, mw2, returnsEarly, notBeingExecuted);

      agent.on("unknownMessage", () => {
        callOrder.push("never happening");
      });

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");

      await sleep(1000);

      expect(callOrder).toEqual(["1", "2"]);
    });

    it("can end an error queue when returning", async () => {
      const callOrder: string[] = [];

      const mw1: AgentMiddleware = () => {
        callOrder.push("mw1");
        throw new Error();
      };

      const mw2: AgentMiddleware = async (_, next) => {
        callOrder.push("mw2 won't be called");
        await next();
      };

      const e1: AgentErrorMiddleware = () => {
        callOrder.push("e1");
        return;
      };

      const e2: AgentErrorMiddleware = async (_error, _ctx, next) => {
        callOrder.push("e2 won't be called");
        await next();
      };

      agent.use(mw1, mw2);

      agent.errors.use(e1, e2);

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");

      await sleep(1000);

      expect(callOrder).toEqual(["mw1", "e1"]);
    });

    it("emits an error if no custom error middleware is registered", async () => {
      const callOrder: string[] = [];

      const errorMessage = "Middleware failed";

      const failingMiddleware: AgentMiddleware = () => {
        throw new Error(errorMessage);
      };

      agent.use(failingMiddleware);

      agent.on("unhandledError", (error) => {
        callOrder.push(error.message);
      });

      await agent.start();

      const otherClient = await createClient();
      const dm = await otherClient.conversations.createDm(client.inboxId);
      await dm.sendText("Hello world");

      await sleep(1000);

      expect(callOrder).toEqual([errorMessage]);
    });
  });
});
