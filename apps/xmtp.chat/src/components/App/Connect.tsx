import { Button, Group } from "@mantine/core";
import { useCallback, type FC } from "react";
import { useNavigate } from "react-router";

export const Connect: FC<{ url?: string }> = ({ url = "/welcome/connect" }) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    void navigate(url);
  }, [navigate]);

  return (
    <Group p="md" justify="center">
      <Button size="md" onClick={handleClick}>
        Connect
      </Button>
    </Group>
  );
};
