import { Button, Group } from "@mantine/core";
import { useNavigate } from "react-router";

export const InboxToolsHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Group align="center" flex={1} gap="md" justify="space-between">
      <Button
        variant="default"
        size="sm"
        onClick={() => {
          void navigate("/");
        }}>
        ← Back to messaging
      </Button>
    </Group>
  );
};
