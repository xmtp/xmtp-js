import { Stack } from "@mantine/core";
import type { StackLayoutComponent } from "@xmtp/content-type-mini-app";
import { useMiniAppContext } from "@xmtp/content-type-mini-app/react";
import { useBorderStyles } from "@/mini-app/useBorderStyles";
import { useFlexStyles } from "@/mini-app/useFlexStyles";

export const StackLayout: React.FC<StackLayoutComponent["props"]> = ({
  children,
  ...props
}) => {
  const { renderComponent } = useMiniAppContext();
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const borderStyles = useBorderStyles(props.border, props.radius);
  return (
    <Stack
      style={{ ...flexStyles, ...borderStyles }}
      p={props.padding}
      m={props.margin}
      gap={props.gap}
      justify={props.justify}
      align={props.align}
      color={props.color}
      bg={props.backgroundColor}>
      {children.map((child) => renderComponent(child))}
    </Stack>
  );
};
