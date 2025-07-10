import { Group, NativeSelect, Stack, Text } from "@mantine/core";
import { type ClientOptions } from "@xmtp/browser-sdk";
import { useSettings } from "@/hooks/useSettings";

export const LoggingSelect: React.FC = () => {
  const { loggingLevel, setLoggingLevel } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoggingLevel(event.currentTarget.value as ClientOptions["loggingLevel"]);
  };

  return (
    <Stack gap="xs">
      <Group gap="xs" justify="space-between">
        <Text fw="bold" size="lg">
          Logging level
        </Text>
        <NativeSelect
          data={["off", "error", "warn", "info", "debug", "trace"]}
          value={loggingLevel}
          onChange={handleChange}
        />
      </Group>
      <Text size="sm">Enable logging to help debug issues</Text>
    </Stack>
  );
};
