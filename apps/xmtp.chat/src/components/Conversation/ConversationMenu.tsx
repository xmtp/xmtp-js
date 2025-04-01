import { Anchor, Button, Menu } from "@mantine/core";
import { Link } from "react-router";
import { IconDots } from "@/icons/IconDots";

export type ConversationMenuProps = {
  type: "group" | "dm";
  onSync: () => void;
  disabled?: boolean;
};

export const ConversationMenu: React.FC<ConversationMenuProps> = ({
  type,
  onSync,
  disabled,
}) => {
  return (
    <Menu shadow="md" disabled={disabled}>
      <Menu.Target>
        <Button
          px="var(--mantine-spacing-xxxs)"
          radius="md"
          size="xs"
          variant="default">
          <IconDots />
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Actions</Menu.Label>
        {type === "group" && (
          <Menu.Item>
            <Anchor
              component={Link}
              to="manage"
              underline="never"
              c="var(--mantine-color-text)"
              size="sm">
              Manage
            </Anchor>
          </Menu.Item>
        )}
        <Menu.Item onClick={onSync}>Sync</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
