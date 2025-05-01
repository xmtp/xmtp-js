import { Group, Stack, Switch, Text } from "@mantine/core";
import React from "react";
import { useSettings } from "@/hooks/useSettings";

export const ForceSCW: React.FC = () => {
  const { forceSCW, setForceSCW } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForceSCW(event.currentTarget.checked);
  };

  return (
    <Stack p="md" bg="var(--mantine-color-gray-light)">
      <Group gap="xs" justify="space-between">
        <Text>Force use of Smart Contract Wallet signatures</Text>
        <Switch size="md" checked={forceSCW} onChange={handleChange} />
      </Group>
      <Text size="sm">
        Use this option if you are experiencing issues when signing with your
        smart contract wallet.
      </Text>
    </Stack>
  );
};
