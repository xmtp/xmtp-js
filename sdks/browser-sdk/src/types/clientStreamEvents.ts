import type {
  StreamEventsClientPostMessageData,
  StreamEventsErrorData,
  StreamEventsResult,
} from "@/types";
import type { SafeConversation, SafeMessage } from "@/utils/conversions";

export type ClientStreamEvents =
  | {
      type: "message";
      streamId: string;
      result: SafeMessage | undefined;
    }
  | {
      type: "group";
      streamId: string;
      result: SafeConversation | undefined;
    };

export type ClientStreamEventsTypes = ClientStreamEvents["type"];

export type ClientStreamEventsResult<A extends ClientStreamEventsTypes> =
  StreamEventsResult<ClientStreamEvents, A>;

export type ClientStreamEventsWorkerPostMessageData<
  A extends ClientStreamEventsTypes,
> = StreamEventsClientPostMessageData<ClientStreamEvents, A>;

export type ClientStreamEventsErrorData =
  StreamEventsErrorData<ClientStreamEvents>;
