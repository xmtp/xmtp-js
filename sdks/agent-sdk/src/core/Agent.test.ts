import type { GroupUpdated } from "@xmtp/content-type-group-updated";
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
import type {
  Client,
  Conversation,
  DecodedMessage,
  Dm,
  Group,
} from "@xmtp/node-sdk";
import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
  type Mock,
} from "vitest";
import { filter } from "@/utils/filter.js";
import { createSigner, createUser } from "@/utils/user.js";
import {
  Agent,
  type AgentErrorMiddleware,
  type AgentMiddleware,
  type AgentOptions,
} from "./Agent.js";
import { ClientContext } from "./ClientContext.js";
import { MessageContext } from "./MessageContext.js";

type CurrentClientTypes =
  | string
  | Reaction
  | Reply
  | RemoteAttachment
  | GroupUpdated;

const createMockMessage = <ContentType = string>(
  overrides: Partial<DecodedMessage> & { content: ContentType },
): DecodedMessage & { content: ContentType } => {
  const { content, ...rest } = overrides;
  return {
    id: "mock-message-id",
    conversationId: "test-conversation-id",
    senderInboxId: "sender-inbox-id",
    contentType: ContentTypeText,
    ...rest,
    content,
  } as unknown as DecodedMessage & { content: ContentType };
};

const createMockStreamWithCallbacks = (messages: DecodedMessage[]) => {
  const mockStream = {
    end: vi.fn().mockResolvedValue(undefined),
    [Symbol.asyncIterator]: vi.fn(),
  };

  const mockImplementation = vi
    .fn()
    .mockImplementation(
      (options: { onValue: (value: DecodedMessage) => void }) => {
        // Simulate async message delivery
        queueMicrotask(() => {
          messages.forEach((message) => {
            options.onValue(message);
          });
        });
        return Promise.resolve(mockStream);
      },
    );

  return mockImplementation;
};

const flushMicrotasks = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("Agent", () => {
  const mockConversation = {
    send: vi.fn().mockResolvedValue(undefined),
  };

  const mockClient = {
    inboxId: "test-inbox-id",
    conversations: {
      sync: vi.fn().mockResolvedValue(undefined),
      stream: vi.fn().mockResolvedValue(undefined),
      streamAllMessages: vi.fn(),
      getConversationById: vi.fn().mockResolvedValue(mockConversation),
    },
    preferences: {
      inboxStateFromInboxIds: vi.fn(),
    },
  };

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
      expectTypeOf(ephemeralAgent).toEqualTypeOf<
        Agent<string | Reaction | Reply | RemoteAttachment | GroupUpdated>
      >();
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
            Dm<string | Reaction | Reply | RemoteAttachment | GroupUpdated>
          >();
        }

        if (ctx.isGroup()) {
          expectTypeOf(ctx.conversation).toEqualTypeOf<
            Group<string | Reaction | Reply | RemoteAttachment | GroupUpdated>
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
      const mockStream = {
        [Symbol.asyncIterator]: vi.fn().mockReturnValue({
          next: vi.fn().mockResolvedValueOnce({ done: true }),
        }),
      };

      mockClient.conversations.streamAllMessages.mockResolvedValue(mockStream);

      const startSpy = vi.fn();
      agent.on("start", startSpy);

      await agent.start();
      await flushMicrotasks();

      expect(mockClient.conversations.streamAllMessages).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    it("should not start twice if already listening", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: vi.fn().mockReturnValue({
          next: vi.fn().mockResolvedValueOnce({ done: true }),
        }),
      };

      mockClient.conversations.streamAllMessages.mockResolvedValue(mockStream);

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

      const mockImplementation = createMockStreamWithCallbacks([
        messageFromSelf,
        messageFromOther,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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
          }) as { senderInboxId: string },
        } as unknown as MessageContext),
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

      const mockImplementation = createMockStreamWithCallbacks([
        reactionFromSelf,
        reactionFromOther,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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
          }) as { senderInboxId: string },
        } as unknown as MessageContext),
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

      const mockImplementation = createMockStreamWithCallbacks([
        textMessage,
        reactionMessage,
        replyMessage,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

      const messageEventSpy = vi.fn();
      const textEventSpy = vi.fn();
      const reactionEventSpy = vi.fn();
      const replyEventSpy = vi.fn();

      agent.on("message", messageEventSpy);
      agent.on("text", textEventSpy);
      agent.on("reaction", reactionEventSpy);
      agent.on("reply", replyEventSpy);

      await agent.start();
      await flushMicrotasks();

      expect(
        messageEventSpy,
        "Generic 'message' event should fire for all message types",
      ).toHaveBeenCalledTimes(3);

      expect(textEventSpy).toHaveBeenCalledTimes(1);
      expect(reactionEventSpy).toHaveBeenCalledTimes(1);
      expect(replyEventSpy).toHaveBeenCalledTimes(1);
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

      const mockImplementation = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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

      const mockImplementation = createMockStreamWithCallbacks([
        messageFromSelf,
        messageFromOther,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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
          }) as { senderInboxId: string },
        } as unknown as MessageContext),
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

      const mockImplementation = createMockStreamWithCallbacks([
        firstMessage,
        secondMessage,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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

      const mockImplementation = createMockStreamWithCallbacks([
        firstMessage,
        secondMessage,
      ]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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
  });

  describe("errors.use", () => {
    const mockConversation = { send: vi.fn() };
    const mockMessage = createMockMessage({
      id: "msg-1",
      conversationId: "conv-1",
      senderInboxId: "inbox-1",
      content: "hello",
    });

    const makeAgent = () => {
      const mockClient = {
        conversations: {
          sync: vi.fn().mockResolvedValue(undefined),
          stream: vi.fn().mockResolvedValue(undefined),
          streamAllMessages: vi.fn(),
          getConversationById: vi.fn().mockResolvedValue(mockConversation),
        },
        preferences: { inboxStateFromInboxIds: vi.fn() },
      } as unknown as Client & {
        conversations: {
          stream: Mock;
          streamAllMessages: Mock;
        };
      };
      return { agent: new Agent({ client: mockClient }), mockClient };
    };

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

      const mockImplementation = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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

      const mockImplementation = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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

      const mockImplementation = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

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

      const mockImplementation = createMockStreamWithCallbacks([mockMessage]);
      mockClient.conversations.streamAllMessages.mockImplementation(
        mockImplementation,
      );

      await agent.start();
      await flushMicrotasks();

      expect(callOrder).toEqual([errorMessage]);
    });
  });
});
