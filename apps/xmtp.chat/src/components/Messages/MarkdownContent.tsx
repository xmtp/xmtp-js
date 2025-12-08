import { Paper } from "@mantine/core";
import { Markdown } from "@/components/Markdown";
import classes from "./MarkdownContent.module.css";

export type MarkdownContentProps = {
  content: string;
};

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
}) => {
  return (
    <Paper
      className={classes.root}
      onClick={(event) => {
        event.stopPropagation();
      }}
      py="xs"
      px="sm"
      radius="md">
      <Markdown markdown={content} />
    </Paper>
  );
};
