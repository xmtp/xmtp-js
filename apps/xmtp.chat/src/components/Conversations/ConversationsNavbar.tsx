import { Badge, Box, Group, Text } from "@mantine/core";
import { useCallback, useEffect /*useRef*/ } from "react";
import { ConversationsList } from "@/components/Conversations/ConversationList";
import { ConversationsMenu } from "@/components/Conversations/ConversationsMenu";
import { useConversations } from "@/hooks/useConversations";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ConversationsNavbar: React.FC = () => {
  const { list, loading, syncing, conversations, /*stream,*/ syncAll } =
    useConversations();
  // const stopStreamRef = useRef<(() => void) | null>(null);

  // const startStream = useCallback(async () => {
  //   stopStreamRef.current = await stream();
  // }, [stream]);

  // const stopStream = useCallback(() => {
  //   stopStreamRef.current?.();
  //   stopStreamRef.current = null;
  // }, []);

  const handleSync = useCallback(async () => {
    // stopStream();
    await list(undefined, true);
    // await startStream();
  }, [list /*startStream, stopStream*/]);

  const handleSyncAll = useCallback(async () => {
    // stopStream();
    await syncAll();
    // await startStream();
  }, [syncAll /*startStream, stopStream*/]);

  // loading conversations on mount, and start streaming
  useEffect(() => {
    const loadConversations = async () => {
      await list(undefined);
      // await startStream();
    };
    void loadConversations();
  }, []);

  // stop streaming on unmount
  // useEffect(() => {
  //   return () => {
  //     stopStream();
  //   };
  // }, []);

  return (
    <ContentLayout
      title={
        <Group align="center" gap="xs">
          <Text size="md" fw={700}>
            Conversations
          </Text>
          <Badge color="gray" size="lg">
            {conversations.length}
          </Badge>
        </Group>
      }
      loading={loading}
      headerActions={
        <ConversationsMenu
          onSync={() => void handleSync()}
          onSyncAll={() => void handleSyncAll()}
          disabled={syncing}
        />
      }
      withScrollArea={false}>
      {conversations.length === 0 ? (
        <Box
          display="flex"
          style={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Text>No conversations found</Text>
        </Box>
      ) : (
        <ConversationsList conversations={conversations} />
      )}
    </ContentLayout>
  );
};
