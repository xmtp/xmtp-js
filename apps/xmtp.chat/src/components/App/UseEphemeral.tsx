import { Button, Group, Switch, Text, Tooltip } from "@mantine/core";
import { useCallback } from "react";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useSettings } from "@/hooks/useSettings";

export const UseEphemeral: React.FC = () => {
  const { isConnected } = useConnectWallet();
  const {
    ephemeralAccountEnabled,
    setEphemeralAccountEnabled,
    setEphemeralAccountKey,
  } = useSettings();

  const handleEphemeralAccountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setEphemeralAccountEnabled(event.currentTarget.checked);
  };

  const handleResetEphemeralAccount = useCallback(() => {
    setEphemeralAccountEnabled(false);
    setEphemeralAccountKey(null);
  }, []);

  return (
    <Group gap="sm" align="center" wrap="nowrap">
      <Text fw="bold" size="sm">
        Use ephemeral wallet
      </Text>
      <Tooltip
        label="Enable this option to use a temporary wallet for signing messages"
        refProp="rootRef">
        <Switch
          size="md"
          disabled={isConnected}
          checked={ephemeralAccountEnabled}
          onChange={handleEphemeralAccountChange}
          withThumbIndicator={false}
        />
      </Tooltip>
      <Button
        size="xs"
        onClick={handleResetEphemeralAccount}
        color="red.7"
        variant="outline">
        Reset
      </Button>
    </Group>
  );
};
