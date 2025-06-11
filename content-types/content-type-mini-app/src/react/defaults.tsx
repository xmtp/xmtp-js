import type { FC } from "react";
import { defaultDataActionHandler } from "../data";
import type { ChromeComponent } from "../types/components";
import { useMiniAppContext } from "./context";
import type { ButtonActionMap } from "./types";

export const defaultButtonActionMap: ButtonActionMap = {
  data: defaultDataActionHandler,
  transaction: () => {},
};

export const DefaultChrome: FC<ChromeComponent["props"]> = ({ root }) => {
  const { renderComponent } = useMiniAppContext();
  return renderComponent(root);
};
