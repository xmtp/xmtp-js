import { Button, Group } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";

export const Connect = () => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    void navigate("/welcome/connect");
  }, [navigate]);

  return (
    <Group p="md" justify="center">
      <Button size="md" onClick={handleClick}>
        Connect
      </Button>
    </Group>
  );
};
