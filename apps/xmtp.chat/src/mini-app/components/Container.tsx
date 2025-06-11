import { Box } from "@mantine/core";
import type { ContainerComponent } from "@xmtp/content-type-mini-app";
import { useMiniAppContext } from "@xmtp/content-type-mini-app/react";
import { useBorderStyles } from "@/mini-app/useBorderStyles";
import { useFlexStyles } from "@/mini-app/useFlexStyles";

export const Container: React.FC<ContainerComponent["props"]> = ({
  children,
  ...props
}) => {
  const { renderComponent } = useMiniAppContext();
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const borderStyles = useBorderStyles(props.border, props.radius);
  return (
    <Box
      style={{ ...flexStyles, ...borderStyles }}
      p={props.padding}
      m={props.margin}
      w={props.width}
      h={props.height}
      color={props.color}
      bg={props.backgroundColor}>
      {children.map((child) => renderComponent(child))}
    </Box>
  );
};
