import { ActionIcon, Menu, Stack, Text } from "@mantine/core";
import { IconRefresh } from "@/icons/IconRefresh";

export type ConversationsMenuProps = {
  onSync: () => void;
  onSyncAll: () => void;
  onSendSyncRequest: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export const ConversationsMenu: React.FC<ConversationsMenuProps> = ({
  onSync,
  onSyncAll,
  onSendSyncRequest,
  disabled,
  loading,
}) => {
  return (
    <Menu shadow="md" disabled={disabled} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default" loading={loading} aria-label="Sync Conversations">
          <IconRefresh />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown miw={200}>
        <Menu.Label>Synchronization</Menu.Label>
        <Menu.Item onClick={onSync}>
          <Stack gap={2}>
            <Text size="sm">Sync</Text>
            <Text size="xs" c="dimmed">
              Sync conversations only
            </Text>
          </Stack>
        </Menu.Item>
        <Menu.Item onClick={onSyncAll}>
          <Stack gap={2}>
            <Text size="sm">Sync All</Text>
            <Text size="xs" c="dimmed">
              Sync conversations and messages
            </Text>
          </Stack>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={onSendSyncRequest}>
          <Stack gap={2}>
            <Text size="sm">Send Sync Request</Text>
            <Text size="xs" c="dimmed">
              Send a request to sync with other devices
            </Text>
          </Stack>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
