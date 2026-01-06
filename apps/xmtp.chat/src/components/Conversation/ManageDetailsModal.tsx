import { CloseButton, Group, Paper, Stack, Text } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";
import type { ConversationOutletContext } from "./ConversationOutletContext";

export const ManageDetailsModal: React.FC = () => {
  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const navigate = useNavigate();
  const { environment } = useSettings();
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  const handleClose = useCallback(() => {
    void navigate(`/${environment}/conversations/${conversationId}`);
  }, [navigate, environment, conversationId]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="auto"
      padding={0}>
      <ContentLayout
        maxHeight={contentHeight}
        withScrollAreaPadding={false}
        title={
          <Group justify="space-between" align="center" flex={1}>
            <Text size="lg" fw={700} c="text.primary">
              Conversation Details
            </Text>
            <CloseButton size="md" onClick={handleClose} />
          </Group>
        }>
        <Stack gap="md" p="md">
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Conversation ID
                </Text>
                <BadgeWithCopy value={conversationId} />
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </ContentLayout>
    </Modal>
  );
};
