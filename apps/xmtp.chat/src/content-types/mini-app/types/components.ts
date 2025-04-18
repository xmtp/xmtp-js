import type { ButtonAction } from "@/content-types/mini-app/types/actions";

export type BaseComponent = {
  id?: string;
};

export type BaseComponentProps = {
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
};

export type LayoutComponentProps = BaseComponentProps & {
  gap?: number | string;
  justify?: "start" | "end" | "center" | "between" | "around";
  align?: "start" | "end" | "center" | "stretch";
};

export type RowLayoutComponent = BaseComponent & {
  type: "row-layout";
  props: LayoutComponentProps & {
    wrap?: boolean;
    children: Component[];
  };
};

export type StackLayoutComponent = BaseComponent & {
  type: "stack-layout";
  props: LayoutComponentProps & {
    children: Component[];
  };
};

export type FragmentComponent = BaseComponent & {
  type: "fragment";
  props: BaseComponentProps & {
    children: Component[];
  };
};

export type ContainerComponent = BaseComponent & {
  type: "container";
  props: BaseComponentProps & {
    children: Component[];
  };
};

export type ButtonComponent = BaseComponent & {
  type: "button";
  props: BaseComponentProps & {
    label: string;
    action: ButtonAction;
    size?: string;
  };
};

export type TextComponent = BaseComponent & {
  type: "text";
  props: BaseComponentProps & {
    value: string;
    size?: string;
  };
};

export type ImageComponent = BaseComponent & {
  type: "image";
  props: BaseComponentProps & {
    url: string;
    alt?: string;
    fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  };
};

export type InputComponent = BaseComponent & {
  type: "input";
  props: BaseComponentProps & {
    label?: string;
    type: "text" | "textarea" | "number" | "email" | "date" | "time";
    placeholder?: string;
    required?: boolean;
  };
};

export type SelectComponent = BaseComponent & {
  type: "select";
  props: BaseComponentProps & {
    label?: string;
    multiple?: boolean;
    options: string[];
  };
};

export type Component =
  | ButtonComponent
  | TextComponent
  | ImageComponent
  | RowLayoutComponent
  | StackLayoutComponent
  | FragmentComponent
  | ContainerComponent
  | InputComponent;
