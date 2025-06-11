import type { Client, ExtractCodecContentTypes } from "@xmtp/browser-sdk";
import type { ValidValue } from "../data";
import type { MiniAppCodec } from "../MiniApp";
import type { Component } from "./components";
import type { MiniAppActionContent } from "./content";

/**
 * This is a special action used to send data from the mini app to the host app
 * Its implementation cannot be customized.
 */
export type DataAction = {
  type: "data";
  /**
   * Special data string format
   * "#<id>" = value of input for component with id <id>
   * "$<id>" = value of mini app data with id <id>
   */
  payload: Record<string, ValidValue> & {
    expiration?: string;
  };
};

export type TransactionAction = {
  type: "transaction";
  payload: {
    amount: number | string;
    chainId: string;
    description?: string;
    expiration?: string;
    quantity?: number | string;
    recipientAddress: string;
  };
};

export type ButtonAction = DataAction | TransactionAction;

export type ButtonActionHandler<BA extends ButtonAction = ButtonAction> = (
  data: BA["payload"],
  content: MiniAppActionContent<UIAction>,
  client: Client<ExtractCodecContentTypes<[MiniAppCodec]>>,
  senderInboxId: string,
) => void | Promise<void>;

export type UIAction = {
  type: "ui";
  payload: {
    uuid: string;
    data?: Record<string, ValidValue>;
    root: Component;
  };
};

export type HelpCommandArg = {
  name: string;
  description?: string;
  values?: string[];
};

export type HelpCommand = {
  name: string;
  context: "group" | "dm";
  description?: string;
  args?: HelpCommandArg[];
};

export type HelpAction = {
  type: "help";
  payload: {
    version: string;
    commands: HelpCommand[];
  };
};

export type MiniAppAction = HelpAction | UIAction;
