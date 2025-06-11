import type { Client, ExtractCodecContentTypes } from "@xmtp/browser-sdk";
import React, { createContext, useContext } from "react";
import { type ValidData, type ValidValue } from "../data";
import type { MiniAppCodec } from "../MiniApp";
import type { ButtonAction } from "../types/actions";
import type { Component } from "../types/components";
import type { MiniAppManifest } from "../types/content";
import { DefaultChrome } from "./defaults";
import type { ButtonActionMap, ComponentMap } from "./types";

export type MiniAppContextValue = {
  buttonActionMap: ButtonActionMap;
  client?: Client<ExtractCodecContentTypes<[MiniAppCodec]>>;
  componentMap: ComponentMap;
  data?: Record<string, ValidValue>;
  manifest?: MiniAppManifest;
  handleAction: (action: ButtonAction) => Promise<void> | void;
  handleInputChange: (id: string, value: ValidData) => void;
  renderComponent: (component: Component) => React.JSX.Element;
  senderInboxId?: string;
  uuid?: string;
  completed: boolean;
};

export const MiniAppContext = createContext<MiniAppContextValue>({
  buttonActionMap: {
    transaction: () => {},
    data: () => {},
  },
  componentMap: {
    chrome: DefaultChrome,
    layout: () => <></>,
    fragment: () => <></>,
    container: () => <></>,
    button: () => <></>,
    text: () => <></>,
    image: () => <></>,
    input: () => <></>,
  },
  handleAction: () => {},
  handleInputChange: () => {},
  renderComponent: () => <></>,
  completed: false,
});

export const useMiniAppContext = () => {
  return useContext(MiniAppContext) as MiniAppContextValue &
    Required<
      Pick<
        MiniAppContextValue,
        "client" | "senderInboxId" | "uuid" | "manifest"
      >
    >;
};
