import { Card, Flex, Stack, Text } from "@mantine/core";
import {
  SortDirection,
  type Conversation,
  type DecodedMessage,
} from "@xmtp/browser-sdk";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { nsToDate } from "../helpers/date";
import { useConversation } from "../hooks/useConversation";
import styles from "./ConversationCard.module.css";

export type ConversationCardProps = {
  conversation: Conversation;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
}) => {
  const [memberCount, setMemberCount] = useState(0);
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<DecodedMessage | null>(null);
  const { getMessages } = useConversation(conversation);

  useEffect(() => {
    const loadMessages = async () => {
      const messages = await getMessages({
        direction: SortDirection.Descending,
        limit: 1n,
      });
      setLastMessage(messages[0] ?? null);
      setMessageCount(messages.length);
    };
    void loadMessages();
  }, [conversation]);

  useEffect(() => {
    void conversation.members().then((members) => {
      setMemberCount(members.length);
    });
  }, [conversation.id]);

  return (
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
          {memberCount} member{memberCount !== 1 ? "s" : ""}, {messageCount}{" "}
          message{messageCount !== 1 ? "s" : ""}
        </Text>
        {lastMessage && (
          <Text size="sm" c="dimmed" mt="xs">
            Last message sent{" "}
            {formatDistanceToNow(nsToDate(lastMessage.sentAtNs), {
              addSuffix: true,
            })}
          </Text>
        )}
      </Stack>
    </Card>
  );
};
