import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import type { Reaction } from "@xmtp/content-type-reaction";
import type { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it, vi, type Mock } from "vitest";
import { createSigner, createUser } from "@/utils/user.js";
import { Agent, type AgentMiddleware, type AgentOptions } from "./Agent.js";
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
  } as unknown as DecodedMessage;

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
      ephemeralAgent.on("message", (ctx) => {
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
      agent.on("message", handler);

      void agent.emit(
        "message",
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
      agent.on("error", onError);

      agent.use(async (ctx, next) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("A");
        await next();
      });

      agent.use((ctx) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("B");
        throw new Error("Initial error");
      });

      agent.errors.use(async (err, ctx, next) => {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe("Initial error");
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("E1");
        // Transform the initial error
        await next(new Error("Transformed error"));
      });

      agent.errors.use(async (err, ctx, next) => {
        expect((err as Error).message).toBe("Transformed error");
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("E2");
        // Resume middleware chain
        await next();
      });

      agent.use(async (ctx, next) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("C");
        await next();
      });

      agent.use(async (ctx, next) => {
        expect(ctx).toBeInstanceOf(AgentContext);
        callOrder.push("D");
        await next();
      });

      agent.on("message", () => {
        callOrder.push("EMIT");
      });

      // Stream yields one message then ends
      mockClient.conversations.streamAllMessages.mockResolvedValue(
        (function* () {
          yield mockMessage;
        })(),
      );

      await agent.start();

      expect(callOrder).toEqual(["A", "B", "E1", "E2", "C", "D", "EMIT"]);
      expect(
        onError,
        "error chain recovered, no final error is emitted",
      ).toHaveBeenCalledTimes(0);
    });
  });
});
