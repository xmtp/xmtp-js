import { Text, type TextProps } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";

export type BreakableTextProps = TextProps & {
  children: ReactNode;
};

export const BreakableText: React.FC<BreakableTextProps> = ({
  children,
  style,
  ...textProps
}) => {
  const baseStyle: CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "inherit",
  };
  return (
    <Text style={{ ...baseStyle, ...style }} {...textProps}>
      {children}
    </Text>
  );
};

export default BreakableText;
