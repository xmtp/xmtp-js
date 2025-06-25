import type { ClientAction } from "@/types/actions/client";
import type { ConversationAction } from "@/types/actions/conversation";
import type { ConversationsAction } from "@/types/actions/conversations";
import type { DebugInformationAction } from "@/types/actions/debugInformation";
import type { DmAction } from "@/types/actions/dm";
import type { GroupAction } from "@/types/actions/group";
import type { PreferencesAction } from "@/types/actions/preferences";

type UnknownAction = {
  action: string;
  id: string;
  result: unknown;
  data: unknown;
};

export type ClientWorkerAction =
  | {
      action: "endStream";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  | ClientAction
  | ConversationAction
  | ConversationsAction
  | DmAction
  | GroupAction
  | PreferencesAction
  | DebugInformationAction;

export type ActionName<T extends UnknownAction> = T["action"];

export type ExtractAction<
  T extends UnknownAction,
  A extends ActionName<T>,
> = Extract<T, { action: A }>;

export type ExtractActionWithoutData<
  T extends UnknownAction,
  A extends ActionName<T>,
> = Omit<ExtractAction<T, A>, "data">;

export type ExtractActionWithoutResult<
  T extends UnknownAction,
  A extends ActionName<T>,
> = Omit<ExtractAction<T, A>, "result">;

export type ExtractActionData<
  T extends UnknownAction,
  A extends ActionName<T>,
> = ExtractAction<T, A>["data"];

export type ExtractActionResult<
  T extends UnknownAction,
  A extends ActionName<T>,
> = ExtractAction<T, A>["result"];

export type ActionWithoutData<T extends UnknownAction> = {
  [A in T["action"]]: Omit<Extract<T, { action: A }>, "data">;
}[T["action"]];

export type ActionWithoutResult<T extends UnknownAction> = {
  [A in T["action"]]: Omit<Extract<T, { action: A }>, "result">;
}[T["action"]];

export type ActionErrorData<T extends UnknownAction> = {
  id: string;
  action: ActionName<T>;
  error: Error;
};

export type ExtractActionGroup<
  T extends UnknownAction,
  U extends string,
> = Extract<T, { action: `${U}.${string}` }>;
