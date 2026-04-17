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
interface SenderWindow {
  count: number;
  windowStart: number;
  replied: boolean;
}

export class RateLimiter<ContentTypes = unknown> {
  #maxMessages: number;
  #windowMs: number;
  #behavior: "drop" | "reply";
  #replyText: string;
  #onRateLimit?: (senderInboxId: string) => void;
  #windows = new Map<string, SenderWindow>();

  constructor(config: RateLimiterConfig = {}) {
    this.#maxMessages = config.maxMessages ?? 10;
    this.#windowMs = config.windowMs ?? 60_000;
    this.#behavior = config.behavior ?? "drop";
    this.#replyText =
      config.replyText ??
      "You're sending messages too quickly. Please wait a moment.";
    this.#onRateLimit = config.onRateLimit;
  }

  #checkAndRecord(senderInboxId: string): "allowed" | "limited" | "limited-already-replied" {
    const now = Date.now();
    let window = this.#windows.get(senderInboxId);

    if (!window || now - window.windowStart >= this.#windowMs) {
      this.#windows.set(senderInboxId, { count: 1, windowStart: now, replied: false });
      return "allowed";
    }

    window.count++;

    if (window.count <= this.#maxMessages) {
      return "allowed";
    }

    if (window.replied) {
      return "limited-already-replied";
    }

    window.replied = true;
    return "limited";
  }

  /** Remove all tracked sender state */
  reset(): void {
    this.#windows.clear();
  }

  /** Remove tracked state for a specific sender */
  resetSender(senderInboxId: string): void {
    this.#windows.delete(senderInboxId);
  }

  middleware(): AgentMiddleware<ContentTypes> {
    return async (ctx, next) => {
      const senderId = ctx.message.senderInboxId;
      const result = this.#checkAndRecord(senderId);

      if (result === "allowed") {
        await next();
        return;
      }

      this.#onRateLimit?.(senderId);

      if (this.#behavior === "reply" && result === "limited") {
        await ctx.sendTextReply(this.#replyText);
      }
    };
  }
}
