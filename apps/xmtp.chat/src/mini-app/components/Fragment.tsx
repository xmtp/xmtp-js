import type { FragmentComponent } from "@xmtp/content-type-mini-app";
import { useMiniAppContext } from "@xmtp/content-type-mini-app/react";

export const Fragment: React.FC<FragmentComponent["props"]> = ({
  children,
}) => {
  const { renderComponent } = useMiniAppContext();
  return <>{children.map((child) => renderComponent(child))}</>;
};
