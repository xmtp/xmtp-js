import { renderComponent } from "@/content-types/mini-app/components/mantine/renderComponent";
import type { FragmentComponent } from "@/content-types/mini-app/types";

export const Fragment: React.FC<FragmentComponent["props"]> = ({
  children,
}) => {
  return <>{children.map((child) => renderComponent(child))}</>;
};
