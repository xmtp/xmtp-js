import { Image as MantineImage } from "@mantine/core";
import type { ImageComponent } from "@xmtp/content-type-mini-app";
import { useBorderStyles } from "@/mini-app/useBorderStyles";
import { useFlexStyles } from "@/mini-app/useFlexStyles";

export const Image: React.FC<ImageComponent["props"]> = ({ ...props }) => {
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const borderStyles = useBorderStyles(props.border, props.radius);
  return (
    <MantineImage
      style={{ ...flexStyles, ...borderStyles }}
      p={props.padding}
      bg={props.backgroundColor}
      m={props.margin}
      w={props.width}
      h={props.height}
      src={props.url}
      alt={props.alt}
      fit={props.fit}
      radius={props.radius}
    />
  );
};
