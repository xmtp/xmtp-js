import { Button, Group } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";

export const Connect = () => {
  const navigate = useNavigate();

  const handleConnectClick = useCallback(() => {
    void navigate("/welcome/connect");
  }, [navigate]);

  const handleInboxToolsClick = useCallback(() => {
    void navigate("/welcome/inbox-tools");
  }, [navigate]);

  return (
    <Group p="md" justify="space-between">
      <Button size="md" onClick={handleInboxToolsClick}>
        Inbox Tools
      </Button>
      <Button size="md" onClick={handleConnectClick}>
        Connect
      </Button>
    </Group>
  );
};
