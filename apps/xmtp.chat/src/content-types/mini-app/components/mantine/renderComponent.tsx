import type { Component } from "@/content-types/mini-app/types";
import components from "./components";

export const renderComponent = (component: Component) => {
  const Component = components[component.type] as React.FC<Component["props"]>;
  return <Component {...component.props} />;
};
