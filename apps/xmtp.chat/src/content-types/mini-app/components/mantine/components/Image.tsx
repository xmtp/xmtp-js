import { Image as MantineImage } from "@mantine/core";
import { useBorderStyles } from "@/content-types/mini-app/components/mantine/useBorderStyles";
import { useFlexStyles } from "@/content-types/mini-app/components/mantine/useFlexStyles";
import type { ImageComponent } from "@/content-types/mini-app/types";

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
