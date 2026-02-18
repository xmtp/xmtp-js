import { Group, NativeSelect, Stack, Text, Tooltip } from "@mantine/core";
import { useXMTP } from "@/contexts/XMTPContext";
import { getNetworkUrl, networkOptions, type AppEnv } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";

export const NetworkSelect: React.FC = () => {
  const { lockState } = useXMTP();
  const { environment, setEnvironment } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(event.currentTarget.value as AppEnv);
  };

  return (
    <Stack gap="xs">
      <Group gap="xs" justify="space-between">
        <Text fw="bold" size="lg">
          Network
        </Text>
        <Tooltip
          label={getNetworkUrl(environment)}
          withArrow
          events={{ hover: true, focus: true, touch: true }}>
          <NativeSelect
            data={networkOptions}
            value={environment}
            onChange={handleChange}
            disabled={lockState !== "available"}
          />
        </Tooltip>
      </Group>
      <Text size="sm">Select the network you want to connect to</Text>
    </Stack>
  );
};
