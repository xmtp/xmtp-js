import { Paper, Text } from "@mantine/core";
import classes from "./TextContent.module.css";

export type FallbackContentProps = {
  text: string;
};

export const FallbackContent: React.FC<FallbackContentProps> = ({ text }) => {
  return (
    <Paper className={classes.text} withBorder py="xs" px="sm" radius="md">
      <Text
        component="pre"
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
        }}>
        {text}
      </Text>
    </Paper>
  );
};
