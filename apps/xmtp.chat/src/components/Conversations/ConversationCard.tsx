import { Box, Card, Flex, Stack, Text } from "@mantine/core";
import { Dm, Group, type Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import styles from "./ConversationCard.module.css";

export type ConversationCardProps = {
  conversation: Conversation;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
}) => {
  const [memberCount, setMemberCount] = useState(0);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { conversationId } = useParams();

  useEffect(() => {
    void conversation.members().then((members) => {
      setMemberCount(members.length);
    });
  }, [conversation.id]);

  useEffect(() => {
    if (conversation instanceof Group) {
      setName(conversation.name ?? "");
    }
    if (conversation instanceof Dm) {
      void conversation.peerInboxId().then((inboxId) => {
        setName(inboxId);
      });
    }
  }, [conversation]);

  return (
    <Box px="sm">
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
        className={[
          styles.root,
          conversation.id === conversationId && styles.selected,
        ].join(" ")}>
        <Stack gap="0">
          <Flex align="center">
            <Text fw={700} truncate>
              {name || "Untitled"}
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
