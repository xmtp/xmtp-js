import type { Component } from "@/content-types/mini-app/types/components";

export type SendGroupMessageAction = {
  type: "send-group-message";
  groupId: string;
  message: string;
};

export type SendDirectMessageAction = {
  type: "send-direct-message";
  inboxIds: string[];
  message: string;
};

export type SendDataAction = {
  type: "send-data";
  dataType: string;
  data: Uint8Array;
};

export type TransactionAction = {
  type: "transaction";
  amount: number;
  quantity?: number;
  chainId: string;
  recipientAddress: string;
};

export type RenderAction = {
  type: "render";
  root: Component;
};

export type HelpCommandArg = {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
};

export type HelpCommand = {
  name: string;
  global: boolean;
  args?: HelpCommandArg[];
};

export type HelpAction = {
  type: "help";
  commands: HelpCommand[];
};

export type ButtonAction =
  | SendGroupMessageAction
  | SendDirectMessageAction
  | TransactionAction;

export type MiniAppAction =
  | SendGroupMessageAction
  | SendDirectMessageAction
  | TransactionAction
  | HelpAction
  | RenderAction;
