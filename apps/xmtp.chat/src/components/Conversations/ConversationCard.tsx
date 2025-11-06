import { Box, Card, Flex, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useConversation } from "@/hooks/useConversation";
import { useSettings } from "@/hooks/useSettings";
import styles from "./ConversationCard.module.css";

export type ConversationCardProps = {
  conversationId: string;
};

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversationId,
}) => {
  const { name, members } = useConversation(conversationId);
  const navigate = useNavigate();
  const { conversationId: paramsConversationId } = useParams();
  const { environment } = useSettings();

  const memberCount = useMemo(() => {
    return members.size;
  }, [members]);

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
            void navigate(`/${environment}/conversations/${conversationId}`);
          }
        }}
        onClick={() =>
          void navigate(`/${environment}/conversations/${conversationId}`)
        }
        className={[
          styles.root,
          conversationId === paramsConversationId && styles.selected,
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
