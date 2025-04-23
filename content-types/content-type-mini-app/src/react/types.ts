import type { FC } from "react";
import type { ButtonAction, ButtonActionHandler } from "../types/actions";
import type { Component } from "../types/components";

export type ComponentMap<T extends Component = Component> = {
  [K in T["type"]]: FC<Extract<T, { type: K }>["props"]>;
};

export type ButtonActionMap<T extends ButtonAction = ButtonAction> = {
  [K in T["type"]]: ButtonActionHandler<Extract<T, { type: K }>>;
};
