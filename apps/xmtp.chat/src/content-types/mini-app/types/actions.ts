import type { Component } from "@/content-types/mini-app/types/components";

export type SendDataAction = {
  type: "send-data";
  data: string[];
};

export type TransactionAction = {
  type: "transaction";
  description?: string;
  amount: number;
  quantity?: number;
  chainId: string;
  recipientAddress: string;
};

export type ButtonAction = SendDataAction | TransactionAction;

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

export type MiniAppAction = HelpAction | RenderAction;
