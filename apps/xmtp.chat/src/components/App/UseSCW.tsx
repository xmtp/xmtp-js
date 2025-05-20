import { Group, Stack, Switch, Text } from "@mantine/core";
import React from "react";
import { useSettings } from "@/hooks/useSettings";

export const UseSCW: React.FC = () => {
  const { useSCW, setUseSCW } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseSCW(event.currentTarget.checked);
  };

  return (
    <Stack p="md">
      <Group gap="xs" justify="space-between">
        <Text fw="bold">Use smart contract wallet</Text>
        <Switch
          size="md"
          checked={useSCW}
          onChange={handleChange}
          withThumbIndicator={false}
        />
      </Group>
      <Text size="sm">
        Enable this option if you're connecting with a smart contract wallet.
      </Text>
    </Stack>
  );
};
