import { ActionIcon, Menu, Stack, Text } from "@mantine/core";
import { IconRefresh } from "@/icons/IconRefresh";

export type ConversationsMenuProps = {
  onSync: () => void;
  onSyncAll: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export const ConversationsMenu: React.FC<ConversationsMenuProps> = ({
  onSync,
  onSyncAll,
  disabled,
  loading,
}) => {
  return (
    <Menu shadow="md" disabled={disabled} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default" loading={loading}>
          <IconRefresh />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown miw={200}>
        <Menu.Label>Synchronization</Menu.Label>
        <Menu.Item onClick={onSync}>
          <Stack gap={2}>
            <Text size="sm">Sync</Text>
            <Text size="xs" c="dimmed">
              Sync new conversations only
            </Text>
          </Stack>
        </Menu.Item>
        <Menu.Item onClick={onSyncAll}>
          <Stack gap={2}>
            <Text size="sm">Sync All</Text>
            <Text size="xs" c="dimmed">
              Full sync of all conversations and messages
            </Text>
          </Stack>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
