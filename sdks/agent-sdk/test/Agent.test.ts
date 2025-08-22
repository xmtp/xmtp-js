import { EventEmitter } from "node:events";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, DecodedMessage } from "@xmtp/node-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Agent, type AgentConfig, type AgentContext } from "@/core/Agent";

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
  conversationId: "test-conversation-id",
  senderInboxId: "sender-inbox-id",
  contentType: ContentTypeText,
  content: "Hello, world!",
} as DecodedMessage;

describe("Agent", () => {
  let agent: Agent;
  let options: AgentConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    options = { client: mockClient as unknown as Client };
    agent = new Agent(options);
  });

  describe("use", () => {
    it("should add middleware and return the agent instance", () => {
      const middleware = vi.fn();
      const result = agent.use(middleware);

      expect(result).toBe(agent);
    });
  });

  describe("on", () => {
    it("should delegate non-message events to EventEmitter", () => {
      const handler = vi.fn();
      const spy = vi.spyOn(EventEmitter.prototype, "on");

      agent.on("custom-event", handler);

      expect(spy).toHaveBeenCalledWith("custom-event", handler);
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

      expect(mockClient.conversations.sync).toHaveBeenCalled();
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

      await agent.start();
      await agent.start(); // second call should return early

      expect(mockClient.conversations.sync).toHaveBeenCalledTimes(1);
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

  describe("message processing", () => {
    beforeEach(() => {
      mockClient.conversations.getConversationById.mockResolvedValue(
        mockConversation,
      );
      mockClient.preferences.inboxStateFromInboxIds.mockResolvedValue([
        { identifiers: [{ identifier: "0x123..." }] },
      ]);
    });

    it("should execute send function correctly", async () => {
      let contextSend: ((text: string) => Promise<void>) | undefined;
      const handler = vi.fn((ctx: AgentContext) => {
        contextSend = ctx.sendText;
      });

      agent.on("message", handler, () => true);

      await agent["processMessage"](mockMessage);

      assert(contextSend);
      await contextSend("Test response");
      expect(mockConversation.send).toHaveBeenCalledWith(
        "Test response",
        ContentTypeText,
      );
    });

    it("should get the sender's address correctly", async () => {
      let getSenderAddress: (() => Promise<string>) | undefined;
      const handler = vi.fn((ctx: AgentContext) => {
        getSenderAddress = ctx.getSenderAddress;
      });

      agent.on("message", handler, () => true);

      await agent["processMessage"](mockMessage);

      assert(getSenderAddress);

      const address = await getSenderAddress();
      expect(address).toBe("0x123...");
      expect(
        mockClient.preferences.inboxStateFromInboxIds,
      ).toHaveBeenCalledWith(["sender-inbox-id"]);
    });

    it("should skip processing when conversation is not found", async () => {
      mockClient.conversations.getConversationById.mockResolvedValue(null);
      const handler = vi.fn();

      agent.on("message", handler, () => true);

      await agent["processMessage"](mockMessage);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should emit error events when processing fails", async () => {
      const testError = new Error("Test error");
      const errorSpy = vi.fn();

      // mock the conversation lookup to throw an error
      mockClient.conversations.getConversationById.mockRejectedValue(testError);
      agent.on("error", errorSpy);

      try {
        await agent["processMessage"](mockMessage);
      } catch (error: unknown) {
        agent["handleError"](error);
      }

      expect(errorSpy).toHaveBeenCalledWith(testError);
    });
  });
});
