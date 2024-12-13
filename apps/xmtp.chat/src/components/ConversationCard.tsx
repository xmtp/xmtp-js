import { Card, Flex, Skeleton, Stack, Text } from "@mantine/core";
import { type Conversation, type SafeGroupMember } from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
// import { useMessages } from "../hooks/useMessages";
import { AddressBadge } from "./AddressBadge";
import styles from "./ConversationCard.module.css";

export type ConversationCardProps = {
  conversation: Conversation;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
}) => {
  const [members, setMembers] = useState<SafeGroupMember[]>([]);
  const navigate = useNavigate();
  // const { messages } = useMessages(conversation);

  useEffect(() => {
    void conversation.members().then(setMembers);
  }, [conversation.id]);

  const title = useMemo(() => {
    if (conversation.name)
      return (
        <Flex gap="xs" align="center">
          <Text fw={700}>{conversation.name}</Text>
        </Flex>
      );

    if (members.length > 0) {
      return (
        <Flex gap="xs" align="center">
          {members.length > 0 && (
            <AddressBadge
              key={members[0].accountAddresses[0]}
              address={members[0].accountAddresses[0]}
            />
          )}
          {members.length > 1 && <Text c="dimmed">+{members.length - 1}</Text>}
        </Flex>
      );
    }

    return <Skeleton height="1rem" radius="xl" w="100px" />;
  }, [conversation.id, members]);

  return (
    <Card
      shadow="sm"
      padding="sm"
      radius="md"
      withBorder
      onClick={() => void navigate(`/conversations/${conversation.id}`)}
      style={{ cursor: "pointer" }}
      classNames={{ root: styles.root }}>
      <Stack gap="xs">
        <Flex justify="space-between">
          <Flex align="center" gap="xs">
            {title}
          </Flex>

          {/* {lastMessage && (
          <Text size="sm" c="dimmed">
            {formatDistanceToNow(nsToDate(lastMessage.sentAtNs), {
              addSuffix: true,
            })}
          </Text>
        )} */}
        </Flex>
        <Text c="dimmed" lineClamp={2}>
          Message content here
        </Text>
      </Stack>
    </Card>
  );
};
