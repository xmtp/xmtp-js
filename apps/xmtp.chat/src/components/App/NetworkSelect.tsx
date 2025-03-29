import { Flex, NativeSelect, Text, Tooltip } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { ApiUrls, type XmtpEnv } from "@xmtp/browser-sdk";

export type NetworkSelectProps = {
  disabled?: boolean;
};

export const NetworkSelect: React.FC<NetworkSelectProps> = ({
  disabled = false,
}) => {
  const [network, setNetwork] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(event.currentTarget.value as XmtpEnv);
  };

  return (
    <Flex align="center" gap="xs" justify="space-between">
      <Text size="sm" fw={700}>
        NETWORK
      </Text>
      <Tooltip
        label={ApiUrls[network]}
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <NativeSelect
          data={["local", "dev", "production"]}
          value={network}
          onChange={handleChange}
          disabled={disabled}
        />
      </Tooltip>
    </Flex>
  );
};
