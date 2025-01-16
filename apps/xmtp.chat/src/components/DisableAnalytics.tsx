import { Box, Flex, Switch, Text, Tooltip } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import React from "react";
import { IconInfoCircle } from "../icons/IconInfoCircle";

const DisableAnalyticsLabel = () => {
  return (
    <Flex gap="xs" justify="space-between" align="center">
      <Text>Disable analytics</Text>
      <Tooltip
        multiline
        w={260}
        label="We use the privacy-friendly Plausible Analytics to track usage and improve the app"
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <Box tabIndex={0} w={20} h={20}>
          <IconInfoCircle size={20} />
        </Box>
      </Tooltip>
    </Flex>
  );
};

export const DisableAnalytics: React.FC = () => {
  const [checked, setChecked] = useLocalStorage({
    key: "plausible_ignore",
    defaultValue: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.currentTarget.checked);
  };

  return (
    <Switch
      size="md"
      checked={checked}
      onChange={handleChange}
      labelPosition="left"
      label={<DisableAnalyticsLabel />}
    />
  );
};
