import { Box } from "@mantine/core";
import { renderComponent } from "@/content-types/mini-app/components/mantine/renderComponent";
import { useBorderStyles } from "@/content-types/mini-app/components/mantine/useBorderStyles";
import { useFlexStyles } from "@/content-types/mini-app/components/mantine/useFlexStyles";
import type { ContainerComponent } from "@/content-types/mini-app/types";

export const Container: React.FC<ContainerComponent["props"]> = ({
  children,
  ...props
}) => {
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
