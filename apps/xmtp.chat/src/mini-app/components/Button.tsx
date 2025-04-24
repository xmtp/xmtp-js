import { Button as MantineButton } from "@mantine/core";
import type { ButtonComponent } from "@xmtp/content-type-mini-app";
import { useMiniAppContext } from "@xmtp/content-type-mini-app/react";
import { useCallback } from "react";
import { useBorderStyles } from "@/mini-app/useBorderStyles";
import { useFlexStyles } from "@/mini-app/useFlexStyles";

export const Button: React.FC<ButtonComponent["props"]> = ({ ...props }) => {
  const { handleAction, completed } = useMiniAppContext();
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const borderStyles = useBorderStyles(props.border, props.radius);
  const handleClick = useCallback(() => {
    void handleAction(props.action);
  }, [props.action, handleAction]);

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
      onClick={handleClick}
      disabled={completed}>
      {props.label}
    </MantineButton>
  );
};
