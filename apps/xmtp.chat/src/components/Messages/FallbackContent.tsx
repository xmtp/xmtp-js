import { Box, Paper, Text } from "@mantine/core";
import { renderReactionContent } from "@/helpers/renderReactionContent";
import classes from "./TextContent.module.css";

export type FallbackContentProps = {
  text: string;
};

export const FallbackContent: React.FC<FallbackContentProps> = ({ text }) => {
  // FIXME: Will move this out as it relies on fallbacks
  // Try to detect reaction fallback strings and replace shortcode with image
  const reactedMatch = text.match(/^Reacted “(.+)” to an earlier message$/);
  const removedMatch = text.match(/^Removed “(.+)” from an earlier message$/);
  const match = reactedMatch || removedMatch;

  if (match) {
    const code = match[1];
    const isShortcode = /^:[^\s:]+:$/.test(code);
    if (isShortcode) {
      const prefix = reactedMatch ? "Reacted “" : "Removed “";
      const suffix = reactedMatch
        ? "” to an earlier message"
        : "” from an earlier message";

      return (
        <Paper className={classes.text} withBorder py="xs" px="sm" radius="md">
          <Box
            component="span"
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "inherit",
            }}>
            {prefix}
            {renderReactionContent("shortcode", code)}
            {suffix}
          </Box>
        </Paper>
      );
    }
  }

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
