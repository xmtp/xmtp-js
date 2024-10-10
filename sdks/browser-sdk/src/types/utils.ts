export type GenericEvent = {
  action: string;
  id: string;
  result: unknown;
  data: unknown;
};

export type EventsClientMessageData<Events extends GenericEvent> = {
  [Action in Events["action"]]: Omit<
    Extract<Events, { action: Action }>,
    "result"
  >;
}[Events["action"]];

export type EventsWorkerMessageData<Events extends GenericEvent> = {
  [Action in Events["action"]]: Omit<
    Extract<Events, { action: Action }>,
    "data"
  >;
}[Events["action"]];

export type EventsResult<
  Events extends GenericEvent,
  Action extends Events["action"],
> = Extract<Events, { action: Action }>["result"];

export type SendMessageData<
  Events extends GenericEvent,
  Action extends Events["action"],
> = Extract<Events, { action: Action }>["data"];

export type EventsWorkerPostMessageData<
  Events extends GenericEvent,
  Action extends Events["action"],
> = Omit<Extract<Events, { action: Action }>, "data">;

export type EventsClientPostMessageData<
  Events extends GenericEvent,
  Action extends Events["action"],
> = Omit<Extract<Events, { action: Action }>, "result">;

export type EventsErrorData<Events extends GenericEvent> = {
  id: string;
  action: Events["action"];
  error: string;
};
