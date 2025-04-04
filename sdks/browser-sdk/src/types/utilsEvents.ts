import type { Identifier } from "@xmtp/wasm-bindings";
import type {
  EventsClientMessageData,
  EventsClientPostMessageData,
  EventsErrorData,
  EventsResult,
  EventsWorkerMessageData,
  EventsWorkerPostMessageData,
  SendMessageData,
  XmtpEnv,
} from "@/types";

export type UtilsEvents =
  | {
      action: "init";
      id: string;
      result: undefined;
      data: {
        enableLogging: boolean;
      };
    }
  | {
      action: "generateInboxId";
      id: string;
      result: string;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "getInboxIdForIdentifier";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
        env?: XmtpEnv;
      };
    };

export type UtilsEventsActions = UtilsEvents["action"];

export type UtilsEventsClientMessageData = EventsClientMessageData<UtilsEvents>;

export type UtilsEventsWorkerMessageData = EventsWorkerMessageData<UtilsEvents>;

export type UtilsEventsResult<A extends UtilsEventsActions> = EventsResult<
  UtilsEvents,
  A
>;

export type UtilsSendMessageData<A extends UtilsEventsActions> =
  SendMessageData<UtilsEvents, A>;

export type UtilsEventsWorkerPostMessageData<A extends UtilsEventsActions> =
  EventsWorkerPostMessageData<UtilsEvents, A>;

export type UtilsEventsClientPostMessageData<A extends UtilsEventsActions> =
  EventsClientPostMessageData<UtilsEvents, A>;

export type UtilsEventsErrorData = EventsErrorData<UtilsEvents>;
