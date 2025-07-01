import { Badge, Box, Button, Group, Text } from "@mantine/core";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAccount } from "wagmi";
import { shortAddress } from "@/helpers/strings";

const GlowingCircle = () => {
  return (
    <Box
      w={6}
      h={6}
      bg="green.6"
      style={{
        borderRadius: "50%",
        boxShadow: "0px 0px 2px 2px var(--mantine-color-green-9)",
      }}
    />
  );
};

export const InboxToolsHeader: React.FC = () => {
  const account = useAccount();
  const navigate = useNavigate();

  const handleConnectClick = useCallback(() => {
    void navigate("connect");
  }, [navigate]);

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
      {account.address ? (
        <Badge size="xl" radius="md" variant="default" p={0}>
          <Group align="center" gap="xs" px="sm">
            <GlowingCircle />
            <Text size="xs" fw={700}>
              {shortAddress(account.address)}
            </Text>
          </Group>
        </Badge>
      ) : (
        <Button variant="default" onClick={handleConnectClick}>
          Connect wallet
        </Button>
      )}
    </Group>
  );
};
