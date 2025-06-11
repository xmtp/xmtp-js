import type { ButtonAction } from "./actions";
import type { MiniAppManifest } from "./content";

export type BaseComponentProps = {
  id?: string;
  padding?: number | string;
  margin?: number | string;
  grow?: boolean;
  shrink?: boolean;
  basis?: number | string;
  width?: number | string;
  height?: number | string;
  border?: string;
  radius?: number | string;
  color?: string;
  backgroundColor?: string;
  size?: string;
};

export type LayoutComponent = {
  type: "layout";
  props: BaseComponentProps & {
    layout: "row" | "column";
    gap?: number | string;
    justify?: "start" | "end" | "center" | "between" | "around";
    align?: "start" | "end" | "center" | "stretch";
    wrap?: boolean;
    children: Component[];
  };
};

export type FragmentComponent = {
  type: "fragment";
  props: BaseComponentProps & {
    children: Component[];
  };
};

export type ContainerComponent = {
  type: "container";
  props: BaseComponentProps & {
    children: Component[];
  };
};

export type ButtonComponent = {
  type: "button";
  props: BaseComponentProps & {
    label: string;
    action: ButtonAction;
    size?: string;
  };
};

export type TextComponent = {
  type: "text";
  props: BaseComponentProps & {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    size?: string;
  };
};

export type ImageComponent = {
  type: "image";
  props: BaseComponentProps & {
    url: string;
    alt?: string;
    fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  };
};

export type InputComponent = {
  type: "input";
  props: BaseComponentProps & {
    label?: string;
    type:
      | "text"
      | "textarea"
      | "number"
      | "checkbox"
      | "select"
      | "multi-select";
    description?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    initialValue?: string | number | boolean | string[];
  };
};

export type ChromeComponent = {
  type: "chrome";
  props: {
    manifest: MiniAppManifest;
    root: Component;
  };
};

export type Component =
  | ButtonComponent
  | TextComponent
  | ImageComponent
  | LayoutComponent
  | FragmentComponent
  | ContainerComponent
  | InputComponent;
