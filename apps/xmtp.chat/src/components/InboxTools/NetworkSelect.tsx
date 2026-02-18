import { Group, NativeSelect, Text, Tooltip } from "@mantine/core";
import { getNetworkUrl, networkOptions, type AppEnv } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";

export const NetworkSelect: React.FC = () => {
  const { environment, setEnvironment } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(event.currentTarget.value as AppEnv);
  };

  return (
    <Group gap="xs" justify="space-between">
      <Text fw="bold">XMTP network</Text>
      <Tooltip
        label={getNetworkUrl(environment)}
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <NativeSelect
          data={networkOptions}
          value={environment}
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
};
