import { ActionIcon, Menu } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useRedirect } from "@/hooks/useRedirect";
import { useSettings } from "@/hooks/useSettings";
import { IconDots } from "@/icons/IconDots";

export const AppMenu: React.FC = () => {
  const navigate = useNavigate();
  const { setRedirectUrl } = useRedirect();
  const { environment } = useSettings();

  const handleDisconnect = useCallback(() => {
    setRedirectUrl(`${location.pathname}${location.search}`);
    void navigate("/disconnect");
  }, [navigate, setRedirectUrl]);

  return (
    <Menu shadow="md" position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="default">
          <IconDots />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown miw={200}>
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item
          onClick={() => void navigate(`/${environment}/conversations/new-dm`)}>
          New direct message
        </Menu.Item>
        <Menu.Item
          onClick={() =>
            void navigate(`/${environment}/conversations/new-group`)
          }>
          New group
        </Menu.Item>
        <Menu.Item onClick={handleDisconnect}>Disconnect</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
