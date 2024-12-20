import { Code, Paper } from "@mantine/core";

export type MessageContentProps = {
  content: string;
};

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return typeof content === "string" ? (
    <Paper
      bg="var(--mantine-color-blue-filled)"
      c="white"
      py="xs"
      px="sm"
      radius="md">
      {content}
    </Paper>
  ) : (
    <Code block maw={420}>
      {JSON.stringify(content, null, 2)}
    </Code>
  );
};
