import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import { ReplyCodec, type Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createSigner, createUser } from "@/utils/user";
import { Agent, type AgentOptions } from "./Agent";
import { AgentContext } from "./AgentContext";

describe("Agent", () => {
  const mockClient = {
    inboxId: "test-inbox-id",
    conversations: {
      sync: vi.fn().mockResolvedValue(undefined),
      streamAllMessages: vi.fn(),
      getConversationById: vi.fn(),
    },
    preferences: {
      inboxStateFromInboxIds: vi.fn(),
    },
  };

  const mockConversation = {
    send: vi.fn().mockResolvedValue(undefined),
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
        Agent<string | Reply | GroupUpdated>
      >();
    });

    it("types the content in message event listener", () => {
      ephemeralAgent.on("message", (ctx) => {
        expectTypeOf(ctx).toEqualTypeOf<
          AgentContext<string | Reply | GroupUpdated>
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
  });

  describe("processMessage", () => {
    it("should emit 'message' and allow sending a reply via context", async () => {
      mockClient.conversations.getConversationById.mockResolvedValue(
        mockConversation,
      );

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
});
