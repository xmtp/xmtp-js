import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import type { Reaction } from "@xmtp/content-type-reaction";
import type { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it, vi, type Mock } from "vitest";
import { createSigner, createUser } from "@/utils/user.js";
import {
  Agent,
  type AgentErrorMiddleware,
  type AgentMiddleware,
  type AgentOptions,
} from "./Agent.js";
import { AgentContext } from "./AgentContext.js";

describe("Agent", () => {
  const mockConversation = {
    send: vi.fn().mockResolvedValue(undefined),
  };

  const mockClient = {
    inboxId: "test-inbox-id",
    conversations: {
      sync: vi.fn().mockResolvedValue(undefined),
      streamAllMessages: vi.fn(),
      getConversationById: vi.fn().mockResolvedValue(mockConversation),
    },
    preferences: {
      inboxStateFromInboxIds: vi.fn(),
    },
  };

  const mockMessage = {
    id: "message-id-1",
    conversationId: "test-conversation-id",
    senderInboxId: "sender-inbox-id",
    contentType: ContentTypeText,
    content: "Hello, world!",
  } as unknown as DecodedMessage & { content: string };

  let agent: Agent<unknown>;
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
      ephemeralAgent.on("unhandledMessage", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<
          AgentContext<
            string | Reaction | Reply | RemoteAttachment | GroupUpdated
          >
        >();
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

      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (async function* () {
          yield Promise.resolve(mockMessage);
        })(),
      );

      await agent.start();

      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(
        expect.any(AgentContext),
        expect.any(Function),
      );
    });

    it("should execute multiple middleware in order", async () => {
      const calls: string[] = [];

      const middleware1 = vi.fn<AgentMiddleware>(async (_, next) => {
        calls.push("middleware1-start");
        await next();
        calls.push("middleware1-end");
      });

      const middleware2 = vi.fn<AgentMiddleware>(async (_, next) => {
        calls.push("middleware2-start");
        await next();
        calls.push("middleware2-end");
      });

      agent.use(middleware1);
      agent.use(middleware2);

      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (async function* () {
          yield Promise.resolve(mockMessage);
        })(),
      );

      await agent.start();

      expect(calls).toEqual([
        "middleware1-start",
        "middleware2-start",
        "middleware2-end",
        "middleware1-end",
      ]);
    });
  });

  describe("emit", () => {
    it("should emit 'message' and allow sending a reply via context", async () => {
      let contextSend: ((text: string) => Promise<void>) | undefined;
      const handler = vi.fn((ctx: AgentContext) => {
        contextSend = ctx.sendText.bind(ctx);
      });
      agent.on("unhandledMessage", handler);

      void agent.emit(
        "unhandledMessage",
        new AgentContext(
          mockMessage,
          mockConversation as unknown as Conversation,
          agent.client,
        ),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      assert(contextSend);
      await contextSend("Test response");
      expect(mockConversation.send).toHaveBeenCalledWith(
        "Test response",
        ContentTypeText,
      );
    });
  });

  describe("stop", () => {
    it("should stop listening and emit stop event", () => {
      const stopSpy = vi.fn();
      agent.on("stop", stopSpy);

      agent.stop();

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    const mockConversation = { send: vi.fn() };
    const mockMessage = {
      id: "msg-1",
      conversationId: "conv-1",
      senderInboxId: "inbox-1",
      contentType: ContentTypeText,
      content: "hello",
    } as unknown as DecodedMessage;

    const makeAgent = () => {
      const mockClient = {
        conversations: {
          sync: vi.fn().mockResolvedValue(undefined),
          streamAllMessages: vi.fn(),
          getConversationById: vi.fn().mockResolvedValue(mockConversation),
        },
        preferences: { inboxStateFromInboxIds: vi.fn() },
      } as unknown as Client & {
        conversations: {
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
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("1");
        await next();
      };

      const mw2: AgentMiddleware = (ctx) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("2");
        throw new Error("Initial error");
      };

      const mw3: AgentMiddleware = async (ctx, next) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("3");
        await next();
      };

      const mw4: AgentMiddleware = async (ctx, next) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("4");
        await next();
      };

      const e1: AgentErrorMiddleware = async (err, ctx, next) => {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe("Initial error");
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("E1");
        // Transform the initial error
        await next(new Error("Transformed error"));
      };

      const e2: AgentErrorMiddleware = async (err, ctx, next) => {
        expect((err as Error).message).toBe("Transformed error");
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("E2");
        // Resume middleware chain
        await next();
      };

      agent.use([mw1, mw2], [mw3], mw4);
      agent.errors.use(e1, e2);

      agent.on("text", () => {
        callOrder.push("EMIT");
      });

      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (function* () {
          yield mockMessage;
        })(),
      );

      await agent.start();

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

      agent.on("unhandledMessage", () => {
        callOrder.push("never happening");
      });

      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (function* () {
          yield mockMessage;
        })(),
      );

      await agent.start();

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

      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (function* () {
          yield mockMessage;
        })(),
      );

      await agent.start();

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

      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (function* () {
          yield mockMessage;
        })(),
      );

      await agent.start();

      expect(callOrder).toEqual([errorMessage]);
    });
  });
});
