import type { AgentMiddleware } from "@/core/Agent";

export interface RateLimiterConfig {
  /** Maximum number of messages allowed per sender within the time window (default: 10) */
  maxMessages?: number;
  /** Time window in milliseconds (default: 60000) */
  windowMs?: number;
  /** Action to take when a sender exceeds the rate limit (default: "drop") */
  behavior?: "drop" | "reply";
  /** Text to send when behavior is "reply" (default: "You're sending messages too quickly. Please wait a moment.") */
  replyText?: string;
  /** Called when a message is rate limited */
  onRateLimit?: (senderInboxId: string) => void;
}

/**
 * Middleware that throttles incoming messages on a per-sender basis using a
 * sliding-window counter. Place it early in the middleware chain so
 * rate-limited messages never reach downstream handlers.
 *
 * ```ts
 * const limiter = new RateLimiter({ maxMessages: 5, windowMs: 30_000 });
 * agent.use(limiter.middleware());
 * ```
 */
export class RateLimiter<ContentTypes = unknown> {
  #maxMessages: number;
  #windowMs: number;
  #behavior: "drop" | "reply";
  #replyText: string;
  #onRateLimit?: (senderInboxId: string) => void;
  #timestamps = new Map<string, number[]>();

  constructor(config: RateLimiterConfig = {}) {
    this.#maxMessages = config.maxMessages ?? 10;
    this.#windowMs = config.windowMs ?? 60_000;
    this.#behavior = config.behavior ?? "drop";
    this.#replyText =
      config.replyText ??
      "You're sending messages too quickly. Please wait a moment.";
    this.#onRateLimit = config.onRateLimit;
  }

  #isAllowed(senderInboxId: string): boolean {
    const now = Date.now();
    const cutoff = now - this.#windowMs;

    let entries = this.#timestamps.get(senderInboxId);

    if (entries) {
      // Remove timestamps outside the current window
      entries = entries.filter((ts) => ts > cutoff);
    } else {
      entries = [];
    }

    if (entries.length >= this.#maxMessages) {
      this.#timestamps.set(senderInboxId, entries);
      return false;
    }

    entries.push(now);
    this.#timestamps.set(senderInboxId, entries);
    return true;
  }

  /** Remove all tracked sender state */
  reset(): void {
    this.#timestamps.clear();
  }

  /** Remove tracked state for a specific sender */
  resetSender(senderInboxId: string): void {
    this.#timestamps.delete(senderInboxId);
  }

  middleware(): AgentMiddleware<ContentTypes> {
    return async (ctx, next) => {
      const senderId = ctx.message.senderInboxId;

      if (this.#isAllowed(senderId)) {
        await next();
        return;
      }

      this.#onRateLimit?.(senderId);

      if (this.#behavior === "reply") {
        await ctx.sendTextReply(this.#replyText);
      }
    };
  }
}
