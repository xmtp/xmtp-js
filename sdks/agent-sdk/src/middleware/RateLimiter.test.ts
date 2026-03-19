import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimiter } from "@/middleware/RateLimiter";

type MockCtx = {
  message: { senderInboxId: string };
  sendTextReply: ReturnType<typeof vi.fn>;
};

function mockContext(senderInboxId: string): MockCtx {
  return {
    message: { senderInboxId },
    sendTextReply: vi.fn(),
  };
}

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("uses default config values", () => {
      const limiter = new RateLimiter();
      const mw = limiter.middleware();
      expect(typeof mw).toBe("function");
    });
  });

  describe("middleware", () => {
    it("allows messages under the limit", async () => {
      const limiter = new RateLimiter({ maxMessages: 3, windowMs: 10_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);

      expect(next).toHaveBeenCalledTimes(3);
    });

    it("blocks messages over the limit", async () => {
      const limiter = new RateLimiter({ maxMessages: 2, windowMs: 10_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);

      expect(next).toHaveBeenCalledTimes(2);
    });

    it("tracks senders independently", async () => {
      const limiter = new RateLimiter({ maxMessages: 1, windowMs: 10_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      // Both allowed once
      expect(next).toHaveBeenCalledTimes(2);

      // Second message from each should be blocked
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("resets after the time window expires", async () => {
      const limiter = new RateLimiter({ maxMessages: 1, windowMs: 5_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Blocked within window
      await mw(mockContext("sender-a") as never, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Advance past the window
      vi.advanceTimersByTime(5_001);

      await mw(mockContext("sender-a") as never, next);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("uses a sliding window, not a fixed window", async () => {
      const limiter = new RateLimiter({ maxMessages: 2, windowMs: 10_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      // t=0: first message
      await mw(mockContext("sender-a") as never, next);

      // t=6s: second message
      vi.advanceTimersByTime(6_000);
      await mw(mockContext("sender-a") as never, next);
      expect(next).toHaveBeenCalledTimes(2);

      // t=6s: third should be blocked (both messages within 10s window)
      await mw(mockContext("sender-a") as never, next);
      expect(next).toHaveBeenCalledTimes(2);

      // t=11s: first message expired, one slot free
      vi.advanceTimersByTime(5_000);
      await mw(mockContext("sender-a") as never, next);
      expect(next).toHaveBeenCalledTimes(3);
    });
  });

  describe("behavior: drop", () => {
    it("silently drops messages without sending a reply", async () => {
      const limiter = new RateLimiter({
        maxMessages: 1,
        windowMs: 10_000,
        behavior: "drop",
      });
      const mw = limiter.middleware();
      const next = vi.fn();
      const ctx = mockContext("sender-a");

      await mw(ctx as never, next);
      await mw(ctx as never, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.sendTextReply).not.toHaveBeenCalled();
    });
  });

  describe("behavior: reply", () => {
    it("sends the default reply text when rate limited", async () => {
      const limiter = new RateLimiter({
        maxMessages: 1,
        windowMs: 10_000,
        behavior: "reply",
      });
      const mw = limiter.middleware();
      const next = vi.fn();
      const ctx = mockContext("sender-a");

      await mw(ctx as never, next);
      await mw(ctx as never, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(ctx.sendTextReply).toHaveBeenCalledWith(
        "You're sending messages too quickly. Please wait a moment.",
      );
    });

    it("sends custom reply text when configured", async () => {
      const limiter = new RateLimiter({
        maxMessages: 1,
        windowMs: 10_000,
        behavior: "reply",
        replyText: "Slow down!",
      });
      const mw = limiter.middleware();
      const next = vi.fn();
      const ctx = mockContext("sender-a");

      await mw(ctx as never, next);
      await mw(ctx as never, next);

      expect(ctx.sendTextReply).toHaveBeenCalledWith("Slow down!");
    });
  });

  describe("onRateLimit callback", () => {
    it("fires when a message is rate limited", async () => {
      const onRateLimit = vi.fn();
      const limiter = new RateLimiter({
        maxMessages: 1,
        windowMs: 10_000,
        onRateLimit,
      });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      expect(onRateLimit).not.toHaveBeenCalled();

      await mw(mockContext("sender-a") as never, next);
      expect(onRateLimit).toHaveBeenCalledWith("sender-a");
    });

    it("does not fire when messages are allowed", async () => {
      const onRateLimit = vi.fn();
      const limiter = new RateLimiter({
        maxMessages: 5,
        windowMs: 10_000,
        onRateLimit,
      });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);

      expect(onRateLimit).not.toHaveBeenCalled();
    });

    it("fires for each rate-limited message", async () => {
      const onRateLimit = vi.fn();
      const limiter = new RateLimiter({
        maxMessages: 1,
        windowMs: 10_000,
        onRateLimit,
      });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-a") as never, next);

      expect(onRateLimit).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset", () => {
    it("clears all tracked sender state", async () => {
      const limiter = new RateLimiter({ maxMessages: 1, windowMs: 10_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Both are blocked
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      expect(next).toHaveBeenCalledTimes(2);

      limiter.reset();

      // Both allowed again after reset
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      expect(next).toHaveBeenCalledTimes(4);
    });
  });

  describe("resetSender", () => {
    it("clears state for a specific sender only", async () => {
      const limiter = new RateLimiter({ maxMessages: 1, windowMs: 10_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      expect(next).toHaveBeenCalledTimes(2);

      limiter.resetSender("sender-a");

      // sender-a is allowed again, sender-b is still blocked
      await mw(mockContext("sender-a") as never, next);
      await mw(mockContext("sender-b") as never, next);
      expect(next).toHaveBeenCalledTimes(3);
    });
  });

  describe("memory cleanup", () => {
    it("does not grow unboundedly over time", async () => {
      const limiter = new RateLimiter({ maxMessages: 2, windowMs: 1_000 });
      const mw = limiter.middleware();
      const next = vi.fn();

      // Fill up with messages
      for (let i = 0; i < 100; i++) {
        await mw(mockContext(`sender-${i}`) as never, next);
      }

      // Advance past the window so all entries expire
      vi.advanceTimersByTime(1_001);

      // Next call for any sender should trigger cleanup of that sender's expired entries
      await mw(mockContext("sender-0") as never, next);

      // sender-0 should be allowed (old entry expired, new one recorded)
      expect(next).toHaveBeenCalledTimes(101);
    });
  });
});
