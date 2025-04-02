import { Flex, NativeSelect, Text, Tooltip } from "@mantine/core";
import { ApiUrls, type XmtpEnv } from "@xmtp/browser-sdk";
import { useSettings } from "@/hooks/useSettings";

export type NetworkSelectProps = {
  disabled?: boolean;
};

export const NetworkSelect: React.FC<NetworkSelectProps> = ({
  disabled = false,
}) => {
  const { environment, setEnvironment } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(event.currentTarget.value as XmtpEnv);
  };

  return (
    <Flex align="center" gap="xs" justify="space-between">
      <Text size="sm" fw={700}>
        NETWORK
      </Text>
      <Tooltip
        label={ApiUrls[environment]}
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <NativeSelect
          data={["local", "dev", "production"]}
          value={environment}
          onChange={handleChange}
          disabled={disabled}
        />
      </Tooltip>
    </Flex>
  );
};
