import type { MessageFilter } from "@/filters";
import { AgentContext } from "./AgentContext";

export type AgentEventHandler = (ctx: AgentContext) => Promise<void> | void;

type StoredVoidHandler = {
  event: "start" | "stop";
  handler: NoopHandler;
};

type StoredMessageHandler = {
  event: "message";
  handler: AgentEventHandler;
  filter?: MessageFilter;
};

type StoredErrorHandler = {
  event: "error";
  handler: ErrorHandler;
};

type ErrorHandler = (error: unknown) => Promise<void> | void;

type NoopHandler = () => Promise<void> | void;

type AllHandler = AgentEventHandler | ErrorHandler | NoopHandler;

type AllEvents = "message" | "error" | "start" | "stop";

export class AgentEventEmitter {
  private handlers: (
    | StoredMessageHandler
    | StoredErrorHandler
    | StoredVoidHandler
  )[] = [];

  on(
    event: "message",
    handler: AgentEventHandler,
    filter?: MessageFilter,
  ): this;
  on(event: "error", handler: ErrorHandler): this;
  on(event: "start" | "stop", handler: NoopHandler): this;
  on(event: AllEvents, handler: AllHandler, filter?: MessageFilter): this {
    switch (event) {
      case "message":
        this.handlers.push({
          event,
          handler: handler as AgentEventHandler,
          filter,
        });
        break;
      case "error":
        this.handlers.push({
          event,
          handler: handler as ErrorHandler,
        });
        break;
      case "start":
      case "stop":
        this.handlers.push({
          event,
          handler: handler as NoopHandler,
        });
        break;
    }
    return this;
  }

  off(event: "message", handler: AgentEventHandler): this;
  off(event: "error", handler: ErrorHandler): this;
  off(event: "start" | "stop", handler: () => void): this;
  off(event: AllEvents, handler: AllHandler): this {
    const index = this.handlers.findIndex(
      (h) => h.event === event && h.handler === handler,
    );
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  }

  emit(event: "message", ctx: AgentContext): void;
  emit(event: "error", error: unknown): void;
  emit(event: "start" | "stop"): void;
  async emit(event: AllEvents, payload?: unknown): Promise<void> {
    const eventHandlers = this.handlers.filter((h) => h.event === event);
    for (const matchedHandler of eventHandlers) {
      switch (matchedHandler.event) {
        case "message": {
          const isContext = payload instanceof AgentContext;
          const passesFilter = isContext
            ? !matchedHandler.filter ||
              matchedHandler.filter(payload.message, payload.client)
            : false;
          if (isContext && passesFilter) {
            try {
              await matchedHandler.handler(payload);
            } catch (error) {
              this.emit("error", error);
            }
          }
          break;
        }
        default:
          await matchedHandler.handler(payload);
          break;
      }
    }
  }
}
