import { Box, Card, Flex, Stack, Text } from "@mantine/core";
import { type Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./ConversationCard.module.css";

export type ConversationCardProps = {
  conversation: Conversation;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
}) => {
  const [memberCount, setMemberCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    void conversation.members().then((members) => {
      setMemberCount(members.length);
    });
  }, [conversation.id]);

  return (
    <Box pb="sm" px="sm">
      <Card
        shadow="sm"
        padding="sm"
        radius="md"
        withBorder
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void navigate(`/conversations/${conversation.id}`);
          }
        }}
        onClick={() => void navigate(`/conversations/${conversation.id}`)}
        style={{ cursor: "pointer" }}
        classNames={{ root: styles.root }}>
        <Stack gap="0">
          <Flex align="center">
            <Text
              fw={700}
              c={conversation.name ? "text.primary" : "dimmed"}
              truncate="end">
              {conversation.name || "Untitled"}
            </Text>
          </Flex>
          <Text size="sm">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </Text>
        </Stack>
      </Card>
    </Box>
  );
};
