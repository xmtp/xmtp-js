import type {
  Consent,
  DecodedMessage,
  UserPreference,
} from "@xmtp/wasm-bindings";
import type { SafeConversation } from "@/utils/conversions";

export type StreamAction =
  | {
      action: "stream.message";
      streamId: string;
      result: DecodedMessage | undefined;
    }
  | {
      action: "stream.conversation";
      streamId: string;
      result: SafeConversation | undefined;
    }
  | {
      action: "stream.consent";
      streamId: string;
      result: Consent[] | undefined;
    }
  | {
      action: "stream.preferences";
      streamId: string;
      result: UserPreference[] | undefined;
    }
  | {
      action: "stream.messageDeleted";
      streamId: string;
      result: string | undefined;
    }
  | {
      action: "stream.fail";
      streamId: string;
      result: undefined;
    };

export type StreamActionName = StreamAction["action"];

export type ExtractStreamAction<A extends StreamActionName> = Extract<
  StreamAction,
  { action: A }
>;

export type StreamActionResult<A extends StreamActionName> =
  ExtractStreamAction<A>["result"];

export type StreamActionErrorData = {
  action: StreamActionName;
  error: Error;
  streamId: string;
};
