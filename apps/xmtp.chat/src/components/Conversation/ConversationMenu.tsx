import {
  ActionIcon,
  CloseButton,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { Modal } from "@/components/Modal";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useSettings } from "@/hooks/useSettings";
import { IconSettings } from "@/icons/IconSettings";
import { ContentLayout } from "@/layouts/ContentLayout";

export type ConversationMenuProps = {
  conversationId: string;
  type: "group" | "dm";
  onSync: () => void;
  disabled?: boolean;
};

export const ConversationMenu: React.FC<ConversationMenuProps> = ({
  conversationId,
  type,
  onSync,
  disabled,
}) => {
  const navigate = useNavigate();
  const { environment } = useSettings();
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : "70dvh";
  const clientPermissions = useClientPermissions(conversationId);
  const canManageMembers = useMemo(() => {
    return (
      clientPermissions.canAddMembers || clientPermissions.canRemoveMembers
    );
  }, [clientPermissions]);
  const canManageMetadata = useMemo(() => {
    return (
      clientPermissions.canChangeGroupName ||
      clientPermissions.canChangeGroupDescription ||
      clientPermissions.canChangeGroupImage
    );
  }, [clientPermissions]);

  return (
    <>
      <Modal
        opened={detailsModalOpened}
        centered
        withCloseButton={false}
        fullScreen={fullScreen}
        onClose={() => setDetailsModalOpened(false)}
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
              <CloseButton
                size="md"
                onClick={() => setDetailsModalOpened(false)}
              />
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
      <Menu shadow="md" disabled={disabled} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="default">
            <IconSettings />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown miw={200}>
          <Menu.Label>Manage</Menu.Label>
          <Menu.Item
            onClick={() =>
              void navigate(
                `/${environment}/conversations/${conversationId}/manage/consent`,
              )
            }>
            Consent
          </Menu.Item>
          {type === "group" &&
            (canManageMembers ||
              canManageMetadata ||
              clientPermissions.canChangePermissionsPolicy) && (
              <>
                {canManageMembers && (
                  <Menu.Item
                    onClick={() =>
                      void navigate(
                        `/${environment}/conversations/${conversationId}/manage/members`,
                      )
                    }>
                    Members
                  </Menu.Item>
                )}
                {canManageMetadata && (
                  <Menu.Item
                    onClick={() =>
                      void navigate(
                        `/${environment}/conversations/${conversationId}/manage/metadata`,
                      )
                    }>
                    Metadata
                  </Menu.Item>
                )}
                {clientPermissions.canChangePermissionsPolicy && (
                  <Menu.Item
                    onClick={() =>
                      void navigate(
                        `/${environment}/conversations/${conversationId}/manage/permissions`,
                      )
                    }>
                    Permissions
                  </Menu.Item>
                )}
              </>
            )}
          <Menu.Label>Actions</Menu.Label>
          <Menu.Item onClick={onSync}>Sync</Menu.Item>
          <Menu.Item onClick={() => setDetailsModalOpened(true)}>
            Show Details
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
