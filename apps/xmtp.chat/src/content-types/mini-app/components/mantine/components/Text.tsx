import { Text as MantineText } from "@mantine/core";
import { useFlexStyles } from "@/content-types/mini-app/components/mantine/useFlexStyles";
import type { TextComponent } from "@/content-types/mini-app/types";

export const Text: React.FC<TextComponent["props"]> = ({ ...props }) => {
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  return (
    <MantineText
      style={flexStyles}
      p={props.padding}
      m={props.margin}
      w={props.width}
      h={props.height}
      size={props.size}
      c={props.color}>
      {props.value}
    </MantineText>
  );
};
