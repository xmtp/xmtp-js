import { Box, Flex, Switch, Text, Tooltip } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import React from "react";
import { useDisconnect } from "wagmi";
import { useClient } from "@/hooks/useClient";
import { IconInfoCircle } from "@/icons/IconInfoCircle";

const UseEphemeralAccountLabel = () => {
  return (
    <Flex gap="xs" justify="space-between" align="center">
      <Text>Use ephemeral account</Text>
      <Tooltip
        multiline
        w={260}
        label="A private key is generated and stored in the browser's local storage for reuse. To generate a new account, clear the local storage."
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <Box tabIndex={0} w={20} h={20}>
          <IconInfoCircle size={20} />
        </Box>
      </Tooltip>
    </Flex>
  );
};

export const UseEphemeralAccountOption: React.FC = () => {
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectClient } = useClient();
  const [checked, setChecked] = useLocalStorage({
    key: "XMTP_USE_EPHEMERAL_ACCOUNT",
    defaultValue: false,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.currentTarget.checked);
    disconnect(undefined, {
      onSuccess: () => {
        disconnectClient();
      },
    });
  };

  return (
    <Switch
      w="100%"
      size="md"
      checked={checked}
      onChange={handleChange}
      labelPosition="left"
      label={<UseEphemeralAccountLabel />}
    />
  );
};
