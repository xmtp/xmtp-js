import type { MessageFilter } from "@/filters";
import { AgentContext } from "./AgentContext";

export type MessageHandler<ContentTypes = unknown> = (
  ctx: AgentContext<ContentTypes>,
) => Promise<void> | void;

type StoredVoidHandler = {
  event: "start" | "stop";
  handler: NoopHandler;
};

type StoredMessageHandler<ContentTypes> = {
  event: "message";
  handler: MessageHandler<ContentTypes>;
  filter?: MessageFilter;
};

type StoredErrorHandler = {
  event: "error";
  handler: ErrorHandler;
};

type ErrorHandler = (error: unknown) => Promise<void> | void;

type NoopHandler = () => Promise<void> | void;

type AllHandler<ContentTypes> =
  | MessageHandler<ContentTypes>
  | ErrorHandler
  | NoopHandler;

type AllEvents = "message" | "error" | "start" | "stop";

export class AgentEventEmitter<ContentTypes = unknown> {
  private handlers: (
    | StoredMessageHandler<ContentTypes>
    | StoredErrorHandler
    | StoredVoidHandler
  )[] = [];

  on(
    event: "message",
    handler: MessageHandler<ContentTypes>,
    filter?: MessageFilter,
  ): this;
  on(event: "error", handler: ErrorHandler): this;
  on(event: "start" | "stop", handler: NoopHandler): this;
  on(
    event: AllEvents,
    handler: AllHandler<ContentTypes>,
    filter?: MessageFilter,
  ): this {
    switch (event) {
      case "message":
        this.handlers.push({
          event,
          handler: handler as MessageHandler<ContentTypes>,
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

  off(event: "message", handler: MessageHandler<ContentTypes>): this;
  off(event: "error", handler: ErrorHandler): this;
  off(event: "start" | "stop", handler: NoopHandler): this;
  off(event: AllEvents, handler: AllHandler<ContentTypes>): this {
    const index = this.handlers.findIndex(
      (h) => h.event === event && h.handler === handler,
    );
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  }

  emit(event: "message", payload: AgentContext<ContentTypes>): void;
  emit(event: "error", payload: unknown): void;
  emit(event: "start" | "stop"): void;
  async emit(event: AllEvents, payload?: unknown): Promise<void> {
    const eventHandlers = this.handlers.filter((h) => h.event === event);
    for (const matchedHandler of eventHandlers) {
      switch (matchedHandler.event) {
        case "message": {
          const isContext = payload instanceof AgentContext;
          const passesFilter = isContext
            ? !matchedHandler.filter ||
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              matchedHandler.filter(payload.message, payload.client)
            : false;
          if (isContext && passesFilter) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              await matchedHandler.handler(payload);
            } catch (error: unknown) {
              this.emit("error", error);
            }
          }
          break;
        }
        case "error": {
          await matchedHandler.handler(payload);
          break;
        }
        case "start":
        case "stop":
          try {
            await matchedHandler.handler();
          } catch (error: unknown) {
            this.emit("error", error);
          }
          break;
      }
    }
  }
}
