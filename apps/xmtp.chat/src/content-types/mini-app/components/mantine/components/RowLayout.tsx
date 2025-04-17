import { Group } from "@mantine/core";
import { renderComponent } from "@/content-types/mini-app/components/mantine/renderComponent";
import { useBorderStyles } from "@/content-types/mini-app/components/mantine/useBorderStyles";
import { useFlexStyles } from "@/content-types/mini-app/components/mantine/useFlexStyles";
import type { RowLayoutComponent } from "@/content-types/mini-app/types";

export const RowLayout: React.FC<RowLayoutComponent["props"]> = ({
  children,
  ...props
}) => {
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const borderStyles = useBorderStyles(props.border, props.radius);
  return (
    <Group
      style={{ ...flexStyles, ...borderStyles }}
      p={props.padding}
      m={props.margin}
      gap={props.gap}
      justify={props.justify}
      align={props.align}
      wrap={props.wrap ? "wrap" : "nowrap"}
      color={props.color}
      bg={props.backgroundColor}>
      {children.map((child) => renderComponent(child))}
    </Group>
  );
};
