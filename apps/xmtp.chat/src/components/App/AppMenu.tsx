import { Button, Menu } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useRedirect } from "@/hooks/useRedirect";
import { IconDots } from "@/icons/IconDots";

export const AppMenu: React.FC = () => {
  const navigate = useNavigate();
  const { setRedirectUrl } = useRedirect();

  const handleDisconnect = useCallback(() => {
    setRedirectUrl(`${location.pathname}${location.search}`);
    void navigate("/disconnect");
  }, [navigate, setRedirectUrl]);

  return (
    <Menu shadow="md" position="bottom-end">
      <Menu.Target>
        <Button px="xxxs" radius="md" size="xs" variant="default">
          <IconDots />
        </Button>
      </Menu.Target>
      <Menu.Dropdown miw={200}>
        <Menu.Label>Actions</Menu.Label>
        <Menu.Item onClick={() => void navigate("new-dm")}>
          New direct message
        </Menu.Item>
        <Menu.Item onClick={() => void navigate("new-group")}>
          New group
        </Menu.Item>
        <Menu.Item onClick={handleDisconnect}>Disconnect</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
