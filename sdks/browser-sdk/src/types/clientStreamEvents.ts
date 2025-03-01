import type { UserPreference } from "@xmtp/wasm-bindings";
import type {
  StreamEventsClientPostMessageData,
  StreamEventsErrorData,
  StreamEventsResult,
} from "@/types";
import type {
  SafeConsent,
  SafeConversation,
  SafeMessage,
} from "@/utils/conversions";

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
    }
  | {
      type: "consent";
      streamId: string;
      result: SafeConsent[] | undefined;
    }
  | {
      type: "preferences";
      streamId: string;
      result: UserPreference[] | undefined;
    };

export type ClientStreamEventsTypes = ClientStreamEvents["type"];

export type ClientStreamEventsResult<A extends ClientStreamEventsTypes> =
  StreamEventsResult<ClientStreamEvents, A>;

export type ClientStreamEventsWorkerPostMessageData<
  A extends ClientStreamEventsTypes,
> = StreamEventsClientPostMessageData<ClientStreamEvents, A>;

export type ClientStreamEventsErrorData =
  StreamEventsErrorData<ClientStreamEvents>;
