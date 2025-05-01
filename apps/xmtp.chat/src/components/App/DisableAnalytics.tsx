import { Anchor, Group, Stack, Switch, Text } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import React from "react";

export const DisableAnalytics: React.FC = () => {
  const [checked, setChecked] = useLocalStorage({
    key: "plausible_ignore",
    defaultValue: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.currentTarget.checked);
  };

  return (
    <Stack p="md" bg="var(--mantine-color-gray-light)">
      <Group gap="xs" justify="space-between">
        <Text>Disable analytics</Text>
        <Switch size="md" checked={checked} onChange={handleChange} />
      </Group>
      <Text size="sm">
        We use{" "}
        <Anchor
          href="https://plausible.io/privacy-focused-web-analytics"
          target="_blank">
          Plausible Analytics
        </Anchor>{" "}
        to track usage and improve the app.
      </Text>
    </Stack>
  );
};
