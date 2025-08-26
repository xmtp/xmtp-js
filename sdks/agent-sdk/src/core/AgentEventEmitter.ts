import { AgentContext } from "@/core/AgentContext";
import type {
  AllEvents,
  Events,
  ExtractEvent,
  ExtractEventHandlerPayload,
  ExtractFilter,
  ExtractHandler,
} from "@/core/types";

const isAgentContext = <T>(payload: unknown): payload is AgentContext<T> => {
  return payload instanceof AgentContext;
};

export class AgentEventEmitter<ContentTypes = unknown> {
  private handlers: Events<ContentTypes>[] = [];

  on = <E extends AllEvents>(
    event: E,
    handler: ExtractHandler<E, ContentTypes>,
    filter?: ExtractFilter<E, ContentTypes>,
  ) => {
    const eventHandler = {
      event,
      handler,
      filter,
    } as ExtractEvent<E, ContentTypes>;
    this.handlers.push(eventHandler);
    return this;
  };

  off = <E extends AllEvents>(
    event: E,
    handler: ExtractHandler<E, ContentTypes>,
  ) => {
    const index = this.handlers.findIndex(
      (h) => h.event === event && h.handler === handler,
    );
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  };

  emit = async <E extends AllEvents>(
    ...args: undefined extends ExtractEventHandlerPayload<E, ContentTypes>
      ? [event: E]
      : [event: E, payload: ExtractEventHandlerPayload<E, ContentTypes>]
  ): Promise<void> => {
    const event = args[0];
    const payload = args[1];
    const eventHandlers = this.handlers.filter((h) => h.event === event);
    for (const matchedHandler of eventHandlers) {
      switch (matchedHandler.event) {
        case "message": {
          if (isAgentContext<ContentTypes>(payload)) {
            const passesFilter =
              !matchedHandler.filter ||
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              matchedHandler.filter(payload.message, payload.client as any);
            if (passesFilter) {
              try {
                await matchedHandler.handler(payload);
              } catch (error: unknown) {
                void this.emit("error", error as Error);
              }
            }
          }
          break;
        }
        case "error": {
          if (payload instanceof Error) {
            await matchedHandler.handler(payload);
          }
          break;
        }
        case "start":
        case "stop":
          try {
            await matchedHandler.handler();
          } catch (error: unknown) {
            void this.emit("error", error as Error);
          }
          break;
      }
    }
  };
}
