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
    <Stack>
      <Group gap="xs" justify="space-between" align="center">
        <Text fw="bold" size="xl">
          Disable analytics
        </Text>
        <Switch
          size="md"
          checked={checked}
          onChange={handleChange}
          withThumbIndicator={false}
        />
      </Group>
      <Text>
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
