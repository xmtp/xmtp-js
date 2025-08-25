import { MessageFilter } from "../filters";
import { AgentContext, AgentEventHandler } from "./Agent";

type StoredMessageHandler = {
  type: "message";
  handler: AgentEventHandler;
  filter?: MessageFilter;
};

type StoredErrorHandler = {
  type: "error";
  handler: ErrorHandler;
};

type ErrorHandler = (error: unknown) => void;

class SimpleMessageEmitter {
  private handlers: (StoredMessageHandler | StoredErrorHandler)[] = [];

  on(
    event: "message",
    handler: AgentEventHandler,
    filter?: MessageFilter,
  ): this;
  on(event: "error", handler: ErrorHandler): this;
  on(
    event: "message" | "error",
    handler: AgentEventHandler | ErrorHandler,
    filter?: MessageFilter,
  ): this {
    if (event === "message") {
      this.handlers.push({ type: "message", handler, filter });
    } else if (event === "error") {
      this.handlers.push({
        type: event,
        handler: handler as ErrorHandler,
      });
    }
    return this;
  }

  // Unsubscribe from events
  off(event: "message", handler: AgentEventHandler): this;
  off(event: "error", handler: ErrorHandler): this;
  off(
    event: "message" | "error",
    handler: AgentEventHandler | ErrorHandler,
  ): this {
    if (event === "message") {
      const index = this.handlers.findIndex(
        (h) => h.type === "message" && h.handler === handler,
      );
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    } else if (event === "error") {
      const index = this.handlers.findIndex(
        (h) => h.type === "error" && h.handler === handler,
      );
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    }
    return this;
  }

  // Emit events
  emit(event: "message", ctx: AgentContext): boolean;
  emit(event: "error", error: unknown): boolean;
  emit(event: "message" | "error", payload: any): boolean {
    if (event === "message") {
      const messageHandlers = this.handlers.filter(
        (h): h is StoredMessageHandler => h.type === "message",
      );
      if (messageHandlers.length === 0) return false;

      messageHandlers.forEach(({ handler, filter }) => {
        try {
          // If there's a filter, check it first
          if (!filter || filter(payload.message, payload.client)) {
            handler(payload);
          }
        } catch (error) {
          this.emit("error", error);
        }
      });
      return true;
    } else if (event === "error") {
      const errorHandlers = this.handlers.filter(
        (h): h is StoredErrorHandler => h.type === "error",
      );
      if (errorHandlers.length === 0) return false;

      errorHandlers.forEach(({ handler }) => {
        try {
          handler(payload);
        } catch (err) {
          console.error("Error in error handler:", err);
        }
      });
      return true;
    }
    return false;
  }

  // Subscribe once (auto-unsubscribe after first emit)
  once(
    event: "message",
    handler: AgentEventHandler,
    filter?: MessageFilter,
  ): this;
  once(event: "error", handler: ErrorHandler): this;
  once(
    event: "message" | "error",
    handler: AgentEventHandler | ErrorHandler,
    filter?: MessageFilter,
  ): this {
    if (event === "message") {
      const onceHandler: AgentEventHandler = (ctx) => {
        this.off("message", onceHandler);
        (handler as AgentEventHandler)(ctx);
      };
      return this.on("message", onceHandler, filter);
    } else if (event === "error") {
      const onceHandler: ErrorHandler = (error) => {
        this.off("error", onceHandler);
        (handler as ErrorHandler)(error);
      };
      return this.on("error", onceHandler);
    }
    return this;
  }
}

export { SimpleMessageEmitter };

const emitter = new SimpleMessageEmitter();

emitter.on(
  "message",
  (ctx) => {
    ctx.sendText("Hello!");
  },
  (message, client) => message.content !== "",
);

// Subscribe without filter
emitter.on("message", (ctx) => {
  console.log("Got message:", ctx.message.content);
});

emitter.on("error", (error) => {
  console.log("Got message:", error);
});

// Emit message
// One-time subscription
emitter.once("message", (ctx) => {
  console.log("First message received!", ctx);
});

emitter.once("error", (error) => {
  console.log("First message received!", error);
});
