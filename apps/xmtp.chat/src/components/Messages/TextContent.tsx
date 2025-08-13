import { Paper } from "@mantine/core";
import { BreakableText } from "@/components/Messages/BreakableText";
import classes from "./TextContent.module.css";

export type TextContentProps = {
  text: string;
};

export const TextContent: React.FC<TextContentProps> = ({ text }) => {
  return (
    <Paper
      className={classes.text}
      onClick={(event) => {
        event.stopPropagation();
      }}
      bg="var(--mantine-color-blue-filled)"
      c="white"
      py="xs"
      px="sm"
      radius="md">
      <BreakableText>{text}</BreakableText>
    </Paper>
  );
};
