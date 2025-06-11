import type { Client, ExtractCodecContentTypes } from "@xmtp/browser-sdk";
import React, { useCallback, useMemo, useState, type FC } from "react";
import { hydrateActionData, type ValidData } from "../data";
import type { MiniAppCodec } from "../MiniApp";
import type {
  ButtonAction,
  ButtonActionHandler,
  UIAction,
} from "../types/actions";
import type { Component } from "../types/components";
import type { MiniAppActionContent, MiniAppManifest } from "../types/content";
import { MiniAppContext } from "./context";
import { defaultButtonActionMap } from "./defaults";
import type { ButtonActionMap, ComponentMap } from "./types";
import { useAction } from "./useAction";

export type MiniAppRendererProps = {
  buttonActionMap?: ButtonActionMap;
  client: Client<ExtractCodecContentTypes<[MiniAppCodec]>>;
  componentMap: ComponentMap;
  manifest: MiniAppManifest;
  senderInboxId: string;
  content: MiniAppActionContent<UIAction>;
  debug?: boolean;
};

export const MiniAppRenderer: FC<MiniAppRendererProps> = ({
  buttonActionMap = defaultButtonActionMap,
  client,
  componentMap,
  manifest,
  senderInboxId,
  content,
  debug = false,
}) => {
  const { completed, setCompleted } = useAction(content.action.payload.uuid);
  const [inputData, setInputData] = useState<Record<string, ValidData>>({});
  const renderComponent = useCallback(
    (component: Component) => {
      if (debug) {
        console.log("[MiniAppRenderer] Rendering component", component);
      }
      const Component = componentMap[component.type] as FC<Component["props"]>;
      return <Component {...component.props} />;
    },
    [componentMap],
  );
  const handleAction = useCallback(
    async (action: ButtonAction) => {
      if (debug) {
        console.log(
          "[MiniAppRenderer] Handling action",
          content.action.payload.uuid,
          action,
          content.action.payload.data,
          inputData,
          senderInboxId,
        );
      }
      if (completed) {
        if (debug) {
          console.log(
            "[MiniAppRenderer] Action already completed",
            content.action.payload.uuid,
            action,
          );
        }
        return;
      }
      const handler = buttonActionMap[action.type] as ButtonActionHandler;
      await handler(
        hydrateActionData(
          action,
          content.action.payload.data,
          inputData,
        ) as ButtonAction["payload"],
        content,
        client,
        senderInboxId,
      );
      await setCompleted(true);
    },
    [buttonActionMap, content.action.payload.data, inputData],
  );
  const handleInputChange = useCallback((id: string, value: ValidData) => {
    if (debug) {
      console.log(
        "[MiniAppRenderer] Handling input change",
        content.action.payload.uuid,
        id,
        value,
      );
    }
    setInputData((prev) => ({ ...prev, [id]: value }));
  }, []);
  const value = useMemo(
    () => ({
      buttonActionMap,
      client,
      componentMap,
      data: content.action.payload.data,
      renderComponent,
      handleAction,
      handleInputChange,
      senderInboxId,
      uuid: content.action.payload.uuid,
      completed,
      manifest,
    }),
    [
      buttonActionMap,
      client,
      componentMap,
      content.action.payload.data,
      renderComponent,
      handleAction,
      handleInputChange,
      senderInboxId,
      content.action.payload.uuid,
      completed,
      manifest,
    ],
  );
  const Chrome = componentMap.chrome;
  return (
    <MiniAppContext.Provider value={value}>
      <Chrome manifest={manifest} root={content.action.payload.root} />
    </MiniAppContext.Provider>
  );
};
