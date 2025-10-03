import {
  ContentTypeGroupUpdated,
  type GroupUpdated,
} from "@xmtp/content-type-group-updated";
import {
  ContentTypeReaction,
  type Reaction,
} from "@xmtp/content-type-reaction";
import type { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import {
  ContentTypeReply,
  ReplyCodec,
  type Reply,
} from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import {
  Dm,
  Group,
  type Client,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/node-sdk";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { filter } from "@/core/filter.js";
import { createSigner, createUser } from "@/user/User.js";
import {
  createMockConversationStreamWithCallbacks,
  createMockMessage,
  createMockStreamWithCallbacks,
  flushMicrotasks,
  makeAgent,
  mockClient,
  type CurrentClientTypes,
} from "@/utils/TestUtil.js";
import {
  Agent,
  type AgentErrorMiddleware,
  type AgentMiddleware,
  type AgentOptions,
} from "./Agent.js";
import type { ClientContext } from "./ClientContext.js";
import { MessageContext } from "./MessageContext.js";

describe("Agent", () => {
  const mockMessage = createMockMessage({
    id: "message-id-1",
    senderInboxId: "sender-inbox-id",
    content: "Hello, world!",
  });

  let agent: Agent;
  let options: AgentOptions<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    options = { client: mockClient as unknown as Client };
    agent = new Agent(options);
  });

  describe("types", async () => {
    const user = createUser();
    const signer = createSigner(user);
    const ephemeralAgent = await Agent.create(signer, {
      env: "dev",
      dbPath: null,
      codecs: [new ReplyCodec()],
    });

    it("infers additional content types from given codecs", () => {
      expectTypeOf(ephemeralAgent).toEqualTypeOf<Agent<CurrentClientTypes>>();
    });

    it("types the content in message event listener", () => {
      ephemeralAgent.on("unknownMessage", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<MessageContext<CurrentClientTypes>>();
      });
    });

    it("types content for 'attachment' events", () => {
      ephemeralAgent.on("attachment", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<RemoteAttachment>();
      });
    });

    it("types content for 'text' events", () => {
      ephemeralAgent.on("text", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<string>();
      });
    });

    it("types content for 'reaction' events", () => {
      ephemeralAgent.on("reaction", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<Reaction>();
      });
    });

    it("types content for 'reply' events", () => {
      ephemeralAgent.on("reply", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<Reply>();
      });
    });

    it("types content for 'group-update' events", () => {
      ephemeralAgent.on("group-update", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<GroupUpdated>();
      });
    });

    it("should have proper types when using type predicates in 'unknownMessage' event", () => {
      ephemeralAgent.on("unknownMessage", (ctx) => {
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
      ephemeralAgent.on("conversation", (ctx) => {
        if (ctx.isDm()) {
          expectTypeOf(ctx.conversation).toEqualTypeOf<
            Dm<CurrentClientTypes>
          >();
        }

        if (ctx.isGroup()) {
          expectTypeOf(ctx.conversation).toEqualTypeOf<
            Group<CurrentClientTypes>
          >();
        }
      });
    });

    it("types content for 'start' events", () => {
      ephemeralAgent.on("start", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<ClientContext<CurrentClientTypes>>();
      });
    });

    it("types content for 'stop' events", () => {
      ephemeralAgent.on("stop", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<ClientContext<CurrentClientTypes>>();
      });
    });
  });

  describe("start", () => {
    it("should sync conversations and start listening", async () => {
      const mockConversationStream = {
        [Symbol.asyncIterator]: vi.fn().mockReturnValue({
          next: vi.fn().mockResolvedValueOnce({ done: true }),
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };

      const mockMessageStream = {
        [Symbol.asyncIterator]: vi.fn().mockReturnValue({
          next: vi.fn().mockResolvedValueOnce({ done: true }),
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };

      mockClient.conversations.stream.mockResolvedValue(mockConversationStream);
      mockClient.conversations.streamAllMessages.mockResolvedValue(
        mockMessageStream,
      );

      const startSpy = vi.fn();
      agent.on("start", startSpy);

      await agent.start();
      await flushMicrotasks();

      expect(mockClient.conversations.stream).toHaveBeenCalled();
      expect(mockClient.conversations.streamAllMessages).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    it("should not start twice if already listening", async () => {
      const mockConversationStream = {
        [Symbol.asyncIterator]: vi.fn().mockReturnValue({
          next: vi.fn().mockResolvedValueOnce({ done: true }),
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };

      const mockMessageStream = {
        [Symbol.asyncIterator]: vi.fn().mockReturnValue({
          next: vi.fn().mockResolvedValueOnce({ done: true }),
        }),
        end: vi.fn().mockResolvedValue(undefined),
      };

      mockClient.conversations.stream.mockResolvedValue(mockConversationStream);
      mockClient.conversations.streamAllMessages.mockResolvedValue(
        mockMessageStream,
      );

      const startSpy = vi.fn();
      agent.on("start", startSpy);

      await agent.start();
      await agent.start(); // second call should return early

      expect(startSpy).toHaveBeenCalledTimes(1);
    });

    it("should filter messages from the agent itself (same senderInboxId)", async () => {
      const messageFromSelf = createMockMessage({
        id: "message-id-self",
        senderInboxId: mockClient.inboxId,
        content: "Message from self",
      });

      const messageFromOther = createMockMessage({
        id: "message-id-other",
        senderInboxId: "other-inbox-id",
        content: "Message from other",
      });

      const mockStream = createMockStreamWithCallbacks([
        messageFromSelf,
        messageFromOther,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      const textEventSpy = vi.fn();
      const unknownMessageSpy = vi.fn();
      agent.on("text", textEventSpy);
      agent.on("unknownMessage", unknownMessageSpy);

      await agent.start();
      await flushMicrotasks();

      expect(
        textEventSpy,
        "Should not emit events for message from self, but should for message from other",
      ).toHaveBeenCalledTimes(1);
      expect(
        unknownMessageSpy,
        "Filtered text messages don't go to unknownMessage",
      ).toHaveBeenCalledTimes(0);

      expect(textEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            senderInboxId: "other-inbox-id",
          }) as DecodedMessage,
        } as MessageContext),
      );
    });

    it("should filter reaction messages from the agent itself", async () => {
      const reactionFromSelf = createMockMessage<Reaction>({
        id: "reaction-id-self",
        senderInboxId: mockClient.inboxId,
        contentType: ContentTypeReaction,
        content: {
          content: "👍",
          reference: "message-ref-1",
          action: "added",
          schema: "unicode",
        },
      });

      const reactionFromOther = createMockMessage<Reaction>({
        id: "reaction-id-other",
        senderInboxId: "other-inbox-id",
        contentType: ContentTypeReaction,
        content: {
          content: "👍",
          reference: "message-ref-1",
          action: "added",
          schema: "unicode",
        },
      });

      const mockStream = createMockStreamWithCallbacks([
        reactionFromSelf,
        reactionFromOther,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      const reactionEventSpy = vi.fn();
      const unknownMessageSpy = vi.fn();
      agent.on("reaction", reactionEventSpy);
      agent.on("unknownMessage", unknownMessageSpy);

      await agent.start();
      await flushMicrotasks();

      expect(
        reactionEventSpy,
        "Should only emit reaction event for message from other sender",
      ).toHaveBeenCalledTimes(1);
      expect(
        unknownMessageSpy,
        "Filtered text messages don't go to unknownMessage",
      ).toHaveBeenCalledTimes(0);

      expect(reactionEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            senderInboxId: "other-inbox-id",
          }) as DecodedMessage,
        } as MessageContext),
      );
    });

    it("should emit 'group-update' events for group update messages", async () => {
      const groupUpdateMessage = createMockMessage<GroupUpdated>({
        contentType: ContentTypeGroupUpdated,
        content: {
          initiatedByInboxId: "initiator-inbox-id",
          addedInboxes: [{ inboxId: "added-inbox-id" }],
          removedInboxes: [{ inboxId: "removed-inbox-id" }],
          metadataFieldChanges: [],
        },
      });

      const mockStream = createMockStreamWithCallbacks([groupUpdateMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      const groupUpdateEventSpy = vi.fn();
      agent.on("group-update", groupUpdateEventSpy);

      await agent.start();
      await flushMicrotasks();

      expect(groupUpdateEventSpy).toHaveBeenCalledTimes(1);
      expect(groupUpdateEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            contentType: ContentTypeGroupUpdated,
          }) as DecodedMessage<GroupUpdated>,
        } as MessageContext),
      );
    });

    it("should emit generic 'message' event for all message types", async () => {
      const textMessage = createMockMessage({
        id: "text-message-id",
        senderInboxId: "other-inbox-id",
        contentType: ContentTypeText,
        content: "Hello world",
      });

      const reactionMessage = createMockMessage<Reaction>({
        id: "reaction-message-id",
        senderInboxId: "other-inbox-id",
        contentType: ContentTypeReaction,
        content: {
          content: "👍",
          reference: "message-ref-1",
          action: "added",
          schema: "unicode",
        },
      });

      const replyMessage = createMockMessage<Reply>({
        id: "reply-message-id",
        senderInboxId: "other-inbox-id",
        contentType: ContentTypeReply,
        content: {
          content: "This is a reply",
          reference: textMessage.id,
          contentType: ContentTypeText,
        },
      });

      const groupUpdateMessage = createMockMessage<GroupUpdated>({
        contentType: ContentTypeGroupUpdated,
        content: {
          initiatedByInboxId: "inbox-id",
          addedInboxes: [],
          removedInboxes: [],
          metadataFieldChanges: [],
        },
      });

      const mockStream = createMockStreamWithCallbacks([
        textMessage,
        reactionMessage,
        replyMessage,
        groupUpdateMessage,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

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
      await flushMicrotasks();

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
      const mockDm = Object.create(Dm.prototype) as Dm;
      Object.defineProperty(mockDm, "id", {
        value: "dm-conversation-id",
        writable: false,
      });
      Object.defineProperty(mockDm, "topic", {
        value: "dm-topic",
        writable: false,
      });

      const mockGroup = Object.create(Group.prototype) as Group;
      Object.defineProperty(mockGroup, "id", {
        value: "group-conversation-id",
        writable: false,
      });
      Object.defineProperty(mockGroup, "topic", {
        value: "group-topic",
        writable: false,
      });

      const conversationEventSpy = vi.fn();
      agent.on("conversation", conversationEventSpy);

      const mockConversationStream = createMockConversationStreamWithCallbacks([
        mockDm,
        mockGroup,
      ]);
      const mockMessageStream = createMockStreamWithCallbacks([]);

      mockClient.conversations.stream.mockImplementation(
        mockConversationStream,
      );
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockMessageStream,
      );

      await agent.start();
      await flushMicrotasks();

      expect(conversationEventSpy).toHaveBeenCalledTimes(2);

      expect(conversationEventSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          conversation: mockDm,
        }),
      );
      expect(conversationEventSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          conversation: mockGroup,
        }),
      );
    });

    it("should emit specific 'dm' events for direct messages", async () => {
      const mockDm = Object.create(Dm.prototype) as Dm;
      Object.defineProperty(mockDm, "id", {
        value: "dm-conversation-id",
        writable: false,
      });
      Object.defineProperty(mockDm, "topic", {
        value: "dm-topic",
        writable: false,
      });

      const dmEventSpy = vi.fn();
      const conversationEventSpy = vi.fn();
      agent.on("dm", dmEventSpy);
      agent.on("conversation", conversationEventSpy);

      const mockConversationStream = createMockConversationStreamWithCallbacks([
        mockDm,
      ]);
      const mockMessageStream = createMockStreamWithCallbacks([]);

      mockClient.conversations.stream.mockImplementation(
        mockConversationStream,
      );
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockMessageStream,
      );

      await agent.start();
      await flushMicrotasks();

      expect(dmEventSpy).toHaveBeenCalledTimes(1);
      expect(conversationEventSpy).toHaveBeenCalledTimes(1);

      expect(dmEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation: mockDm,
        }),
      );
    });

    it("should emit specific 'group' events for Group conversations", async () => {
      const mockGroup = Object.create(Group.prototype) as Group;
      Object.defineProperty(mockGroup, "id", {
        value: "group-conversation-id",
        writable: false,
      });
      Object.defineProperty(mockGroup, "topic", {
        value: "group-topic",
        writable: false,
      });

      const groupEventSpy = vi.fn();
      const conversationEventSpy = vi.fn();
      agent.on("group", groupEventSpy);
      agent.on("conversation", conversationEventSpy);

      const mockConversationStream = createMockConversationStreamWithCallbacks([
        mockGroup,
      ]);
      const mockMessageStream = createMockStreamWithCallbacks([]);

      mockClient.conversations.stream.mockImplementation(
        mockConversationStream,
      );
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockMessageStream,
      );

      await agent.start();
      await flushMicrotasks();

      expect(groupEventSpy).toHaveBeenCalledTimes(1);
      expect(conversationEventSpy).toHaveBeenCalledTimes(1);

      expect(groupEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation: mockGroup,
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

      const mockStream = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(
        expect.any(MessageContext),
        expect.any(Function),
      );
    });

    it("should filter self messages before they reach middleware", async () => {
      const messageFromSelf = createMockMessage({
        id: "message-from-self",
        senderInboxId: mockClient.inboxId,
        content: "Message from agent itself",
      });

      const messageFromOther = createMockMessage({
        id: "message-from-other",
        senderInboxId: "other-user-inbox",
        content: "Message from other user",
      });

      const middlewareCallsSpy = vi.fn<AgentMiddleware>(async (_, next) => {
        await next();
      });
      agent.use(middlewareCallsSpy);

      const mockStream = createMockStreamWithCallbacks([
        messageFromSelf,
        messageFromOther,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      // Middleware should only be called once (for the message from other user)
      expect(
        middlewareCallsSpy,
        "Middleware should only process messages from other users, not self",
      ).toHaveBeenCalledTimes(1);

      // Verify middleware was called with the message from the other user
      expect(middlewareCallsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            senderInboxId: "other-user-inbox",
          }) as DecodedMessage,
        } as MessageContext),
        expect.any(Function),
      );
    });

    it("should continue to next middleware when next() is called", async () => {
      const firstMessage = createMockMessage({
        id: "first-message",
        senderInboxId: "user-1",
        content: "First message",
      });

      const secondMessage = createMockMessage({
        id: "second-message",
        senderInboxId: "user-2",
        content: "Second message",
      });

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

      const mockStream = createMockStreamWithCallbacks([
        firstMessage,
        secondMessage,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(middlewareCalls).toEqual([
        "mw1-first-message",
        "mw2-first-message",
        "mw3-first-message",
        "mw1-second-message",
        "mw2-second-message",
        "mw3-second-message",
      ]);
    });

    it("should stop the processing chain when the middleware returns", async () => {
      const firstMessage = createMockMessage({
        id: "first-message",
        senderInboxId: "user-1",
        content: "First message",
      });

      const secondMessage = createMockMessage({
        id: "second-message",
        senderInboxId: "user-2",
        content: "Second message",
        contentType: ContentTypeReply,
      });

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

      const mockStream = createMockStreamWithCallbacks([
        firstMessage,
        secondMessage,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(middlewareCalls).toEqual([
        "mw1-first-message",
        "filterReply-first-message",
        "mw3-first-message",
        "mw1-second-message",
        "filterReply-second-message",
      ]);
    });
  });

  describe("emit", () => {
    it("should emit 'message' and allow sending a reply via context", async () => {
      const mockConversation = { send: vi.fn() };
      let contextSend: ((text: string) => Promise<void>) | undefined;
      const handler = vi.fn((ctx: MessageContext) => {
        contextSend = ctx.sendText.bind(ctx);
      });
      agent.on("unknownMessage", handler);

      void agent.emit(
        "unknownMessage",
        new MessageContext({
          message: mockMessage,
          conversation: mockConversation as unknown as Conversation,
          client: agent.client,
        }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      await contextSend?.("Test response");
      expect(mockConversation.send).toHaveBeenCalledWith(
        "Test response",
        ContentTypeText,
      );
    });
  });

  describe("stop", () => {
    it("should stop listening and emit stop event", async () => {
      const stopSpy = vi.fn();
      agent.on("stop", stopSpy);

      await agent.stop();

      expect(stopSpy).toHaveBeenCalled();
    });

    it("should properly clean up both conversation and message streams", async () => {
      const mockConversationStream = {
        end: vi.fn().mockResolvedValue(undefined),
        [Symbol.asyncIterator]: vi.fn(),
      };

      const mockMessageStream = {
        end: vi.fn().mockResolvedValue(undefined),
        [Symbol.asyncIterator]: vi.fn(),
      };

      mockClient.conversations.stream.mockResolvedValue(mockConversationStream);
      mockClient.conversations.streamAllMessages.mockResolvedValue(
        mockMessageStream,
      );

      await agent.start();
      await agent.stop();

      expect(mockConversationStream.end).toHaveBeenCalled();
      expect(mockMessageStream.end).toHaveBeenCalled();
    });
  });

  describe("errors.use", () => {
    const mockMessage = createMockMessage({
      id: "msg-1",
      conversationId: "conv-1",
      senderInboxId: "inbox-1",
      content: "hello",
    });

    it("propagates error, transforms, recovers, and resumes remaining middleware", async () => {
      const { agent, mockClient } = makeAgent();

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

      const mockStream = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(callOrder).toEqual(["1", "2", "E1", "E2", "3", "4", "EMIT"]);
      expect(
        onError,
        "error chain recovered, no final error is emitted",
      ).toHaveBeenCalledTimes(0);
    });

    it("doesn't emit when a middleware returns early", async () => {
      const { agent, mockClient } = makeAgent();

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

      const mockStream = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(callOrder).toEqual(["1", "2"]);
    });

    it("can end an error queue when returning", async () => {
      const { agent, mockClient } = makeAgent();

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

      const mockStream = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(callOrder).toEqual(["mw1", "e1"]);
    });

    it("emits an error if no custom error middleware is registered", async () => {
      const { agent, mockClient } = makeAgent();

      const callOrder: string[] = [];

      const errorMessage = "Middleware failed";

      const failingMiddleware: AgentMiddleware = () => {
        throw new Error(errorMessage);
      };

      agent.use(failingMiddleware);

      agent.on("unhandledError", (error) => {
        callOrder.push(error.message);
      });

      const mockStream = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(mockStream);

      await agent.start();
      await flushMicrotasks();

      expect(callOrder).toEqual([errorMessage]);
    });
  });
});
