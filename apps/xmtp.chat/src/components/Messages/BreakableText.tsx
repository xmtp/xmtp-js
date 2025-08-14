import { Text, type TextProps } from "@mantine/core";
import type { ReactNode } from "react";

export type BreakableTextProps = TextProps & {
  children: ReactNode;
};

export const BreakableText: React.FC<BreakableTextProps> = ({
  children,
  style,
  ...textProps
}) => {
  return (
    <Text
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "inherit",
      }}
      {...textProps}>
      {children}
    </Text>
  );
};

export default BreakableText;
