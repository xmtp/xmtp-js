import { Text as MantineText } from "@mantine/core";
import type { TextComponent } from "@xmtp/content-type-mini-app";
import { useFlexStyles } from "@/mini-app/useFlexStyles";

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
      c={props.color}
      fw={props.bold ? "bold" : undefined}
      fs={props.italic ? "italic" : undefined}
      td={props.underline ? "underline" : undefined}>
      {props.text}
    </MantineText>
  );
};
