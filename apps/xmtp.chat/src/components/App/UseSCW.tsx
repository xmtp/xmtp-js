import { Group, Switch, Text, Tooltip } from "@mantine/core";
import React from "react";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useSettings } from "@/hooks/useSettings";

export const UseSCW: React.FC = () => {
  const { isConnected } = useConnectWallet();
  const { useSCW, setUseSCW, ephemeralAccountEnabled, connector } =
    useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseSCW(event.currentTarget.checked);
  };

  return (
    <Group gap="sm" align="center" wrap="nowrap">
      <Text size="sm" fw="bold">
        Smart contract wallet
      </Text>
      <Tooltip
        label="Enable this option if you're connecting with a smart contract wallet"
        refProp="rootRef">
        <Switch
          size="md"
          disabled={
            ephemeralAccountEnabled || connector === "MetaMask" || isConnected
          }
          checked={useSCW}
          onChange={handleChange}
          withThumbIndicator={false}
        />
      </Tooltip>
    </Group>
  );
};
