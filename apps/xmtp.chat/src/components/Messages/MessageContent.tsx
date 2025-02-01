import { Code, Paper, Text } from "@mantine/core";

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
      <Text style={{ whiteSpace: "pre-wrap" }}>{content}</Text>
    </Paper>
  ) : (
    <Code block maw={420}>
      {JSON.stringify(content, null, 2)}
    </Code>
  );
};
