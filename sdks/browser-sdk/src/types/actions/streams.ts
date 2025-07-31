import type { UserPreference } from "@xmtp/wasm-bindings";
import type {
  SafeConsent,
  SafeConversation,
  SafeMessage,
} from "@/utils/conversions";

export type StreamAction =
  | {
      action: "stream.message";
      streamId: string;
      result: SafeMessage | undefined;
    }
  | {
      action: "stream.conversation";
      streamId: string;
      result: SafeConversation | undefined;
    }
  | {
      action: "stream.consent";
      streamId: string;
      result: SafeConsent[] | undefined;
    }
  | {
      action: "stream.preferences";
      streamId: string;
      result: UserPreference[] | undefined;
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
