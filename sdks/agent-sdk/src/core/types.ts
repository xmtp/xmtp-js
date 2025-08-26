import type { MessageFilter } from "@/filters";
import type { AgentContext } from "./AgentContext";

export type EventHandler<T> = T extends undefined
  ? () => Promise<void> | void
  : (value: T) => Promise<void> | void;

export type Events<ContentTypes = unknown> =
  | {
      event: "start";
      handler: EventHandler<undefined>;
      filter: never;
    }
  | {
      event: "stop";
      handler: EventHandler<undefined>;
      filter: never;
    }
  | {
      event: "message";
      handler: EventHandler<AgentContext<ContentTypes>>;
      filter?: MessageFilter;
    }
  | {
      event: "error";
      handler: EventHandler<Error>;
      filter: never;
    };

export type AllEvents = Events["event"];

export type ExtractEvent<
  E extends Events["event"],
  ContentTypes = unknown,
> = Extract<Events<ContentTypes>, { event: E }>;

export type ExtractHandler<
  E extends AllEvents,
  ContentTypes = unknown,
> = ExtractEvent<E, ContentTypes>["handler"];

export type ExtractFilter<
  E extends AllEvents,
  ContentTypes = unknown,
> = ExtractEvent<E, ContentTypes>["filter"];

export type ExtractEventHandlerPayload<
  E extends AllEvents,
  ContentTypes = unknown,
> =
  ExtractEvent<E, ContentTypes>["handler"] extends EventHandler<infer T>
    ? T
    : never;

export const on = <E extends AllEvents, ContentTypes = unknown>(
  event: E,
  handler: ExtractHandler<E, ContentTypes>,
  filter?: ExtractFilter<E, ContentTypes>,
) => {
  console.log(event, handler, filter);
};

on("error", (err) => {
  console.log();
});

on("start", () => {
  console.log("started");
});

on("stop", () => {
  console.log("stop");
});

on(
  "message",
  (context) => {
    console.log(context.client);
  },
  (message, client) => {
    console.log(message);
    console.log(client);
    return true;
  },
);

export const emit = <E extends AllEvents, ContentTypes = unknown>(
  ...args: undefined extends ExtractEventHandlerPayload<E, ContentTypes>
    ? [event: E]
    : [event: E, payload: ExtractEventHandlerPayload<E, ContentTypes>]
): void => {
  const event = args[0];
  const payload = args[1];
  console.log(event, payload);
};

emit("start");
