import { Button, Group } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";

export const Connect = () => {
  const navigate = useNavigate();

  const handleConnectClick = useCallback(() => {
    void navigate("/welcome/connect");
  }, [navigate]);

  return (
    <Group justify="center">
      <Button size="md" onClick={handleConnectClick}>
        Connect
      </Button>
    </Group>
  );
};
