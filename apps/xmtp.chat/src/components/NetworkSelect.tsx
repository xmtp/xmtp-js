import { Flex, NativeSelect, Text, Tooltip } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { ApiUrls, type XmtpEnv } from "@xmtp/browser-sdk";
import { useDisconnect } from "wagmi";
import { useClient } from "../hooks/useClient";

export const NetworkSelect: React.FC = () => {
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectClient } = useClient();
  const [network, setNetwork] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(event.currentTarget.value as XmtpEnv);
    disconnect(undefined, {
      onSuccess: () => {
        disconnectClient();
      },
    });
  };

  return (
    <Flex align="center" gap="xs" justify="space-between" w="100%">
      <Text size="sm" fw={700}>
        NETWORK
      </Text>
      <Tooltip
        label={ApiUrls[network]}
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <NativeSelect
          variant="filled"
          data={["local", "dev", "production"]}
          value={network}
          onChange={handleChange}
        />
      </Tooltip>
    </Flex>
  );
};
