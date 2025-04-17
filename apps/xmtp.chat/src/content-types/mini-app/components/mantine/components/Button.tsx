import { Button as MantineButton } from "@mantine/core";
import { useCallback } from "react";
import { useBorderStyles } from "@/content-types/mini-app/components/mantine/useBorderStyles";
import { useFlexStyles } from "@/content-types/mini-app/components/mantine/useFlexStyles";
import type { ButtonComponent } from "@/content-types/mini-app/types";

export const Button: React.FC<ButtonComponent["props"]> = ({ ...props }) => {
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const borderStyles = useBorderStyles(props.border, props.radius);
  const handleClick = useCallback(() => {
    // TODO: implement action
    console.log("Button clicked");
  }, [props.action]);

  return (
    <MantineButton
      style={{ ...flexStyles, ...borderStyles }}
      p={props.padding}
      m={props.margin}
      w={props.width}
      h={props.height}
      size={props.size}
      radius={props.radius}
      color={props.color}
      bg={props.backgroundColor}
      onClick={handleClick}>
      {props.label}
    </MantineButton>
  );
};
