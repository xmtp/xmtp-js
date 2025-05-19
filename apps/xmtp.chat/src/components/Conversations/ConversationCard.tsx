import { Box, Card, Flex, Stack, Text } from "@mantine/core";
import { type Conversation, type Dm, type Group } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { ContentTypes } from "@/contexts/XMTPContext";
import styles from "./ConversationCard.module.css";

const isGroupConversation = (
  conversation: Conversation<ContentTypes>,
): conversation is Group<ContentTypes> => {
  return conversation.metadata?.conversationType === "group";
};

const isDmConversation = (
  conversation: Conversation<ContentTypes>,
): conversation is Dm<ContentTypes> => {
  return conversation.metadata?.conversationType === "dm";
};

export type ConversationCardProps = {
  conversation: Conversation<ContentTypes>;
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
    if (isGroupConversation(conversation)) {
      setName(conversation.name ?? "");
    }
    if (isDmConversation(conversation)) {
      void conversation.peerInboxId().then((inboxId) => {
        setName(inboxId);
      });
    }
  }, [conversation.id]);

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
