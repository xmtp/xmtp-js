import { Paper } from "@mantine/core";

export type MessageContentProps = {
  content: string;
};

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <Paper
      bg="var(--mantine-color-blue-filled)"
      c="white"
      py="xs"
      px="sm"
      maw="80%"
      radius="md">
      {content}
    </Paper>
  );
};
