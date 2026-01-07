import { Badge, CloseButton, Group, Paper, Stack, Text } from "@mantine/core";
import { ConsentState, Dm, GroupPermissionsOptions } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { Modal } from "@/components/Modal";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversation } from "@/hooks/useConversation";
import { useSettings } from "@/hooks/useSettings";
import { ContentLayout } from "@/layouts/ContentLayout";
import type { ConversationOutletContext } from "./ConversationOutletContext";

const consentStateLabel = (state: ConsentState) => {
  switch (state) {
    case ConsentState.Unknown:
      return "Unknown";
    case ConsentState.Allowed:
      return "Allowed";
    case ConsentState.Denied:
      return "Denied";
    default:
      return "N/A";
  }
};

const permissionTypeLabel = (type: GroupPermissionsOptions) => {
  switch (type) {
    case GroupPermissionsOptions.Default:
      return "Default";
    case GroupPermissionsOptions.AdminOnly:
      return "Admin Only";
    case GroupPermissionsOptions.CustomPolicy:
      return "Custom Policy";
    default:
      return "N/A";
  }
};

export const ManageDetailsModal: React.FC = () => {
  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const { conversation, members, messages, permissions } =
    useConversation(conversationId);
  const navigate = useNavigate();
  const { environment } = useSettings();
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;
  const [consentState, setConsentState] = useState<ConsentState | null>(null);

  useEffect(() => {
    const loadConsentState = async () => {
      const state = await conversation.consentState();
      setConsentState(state);
    };
    void loadConsentState();
  }, [conversation]);

  const conversationType =
    conversation instanceof Dm ? "Direct Message" : "Group";

  const handleClose = useCallback(() => {
    void navigate(`/${environment}/conversations/${conversationId}`);
  }, [navigate, environment, conversationId]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={true}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="600"
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
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Added By Inbox ID
                </Text>
                <BadgeWithCopy
                  value={conversation.addedByInboxId ?? "Unknown"}
                />
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Conversation Type
                </Text>
                <Text flex="1" size="sm">
                  {conversationType}
                </Text>
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Consent State
                </Text>
                <Text flex="1" size="sm">
                  {consentState === null
                    ? "Loading..."
                    : consentStateLabel(consentState)}
                </Text>
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Permission Type
                </Text>
                <Text flex="1" size="sm">
                  {permissionTypeLabel(
                    permissions?.policyType ?? GroupPermissionsOptions.Default,
                  )}
                </Text>
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Member Count
                </Text>
                <Badge color="gray" size="lg">
                  {members.size}
                </Badge>
              </Group>
              <Group gap="md" wrap="nowrap">
                <Text flex="0 0 25%" style={{ whiteSpace: "nowrap" }}>
                  Message Count
                </Text>
                <Badge color="gray" size="lg">
                  {messages.length}
                </Badge>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </ContentLayout>
    </Modal>
  );
};
