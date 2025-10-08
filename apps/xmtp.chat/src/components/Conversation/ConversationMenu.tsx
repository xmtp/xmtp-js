import { ActionIcon, Menu } from "@mantine/core";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();

  return (
    <Menu shadow="md" disabled={disabled} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default">
          <IconDots />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown miw={200}>
        <Menu.Label>Manage</Menu.Label>
        <Menu.Item onClick={() => void navigate("manage/consent")}>
          Consent
        </Menu.Item>
        {type === "group" && (
          <>
            <Menu.Item onClick={() => void navigate("manage/members")}>
              Members
            </Menu.Item>
            <Menu.Item onClick={() => void navigate("manage/metadata")}>
              Metadata
            </Menu.Item>
            <Menu.Item onClick={() => void navigate("manage/permissions")}>
              Permissions
            </Menu.Item>
          </>
        )}
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item onClick={onSync}>Sync</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
