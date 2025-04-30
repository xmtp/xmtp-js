import { Paper, Text } from "@mantine/core";
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
      <Text
        component="pre"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontFamily: "inherit",
        }}>
        {text}
      </Text>
    </Paper>
  );
};
