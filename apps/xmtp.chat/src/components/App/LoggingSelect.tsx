import { Group, NativeSelect, Text, Tooltip } from "@mantine/core";
import { type ClientOptions } from "@xmtp/browser-sdk";
import { useSettings } from "@/hooks/useSettings";

export const LoggingSelect: React.FC = () => {
  const { loggingLevel, setLoggingLevel } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoggingLevel(event.currentTarget.value as ClientOptions["loggingLevel"]);
  };

  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Text size="sm" fw="bold">
        Logging level
      </Text>
      <Tooltip label="Enable logging to help debug issues">
        <NativeSelect
          data={["off", "error", "warn", "info", "debug", "trace"]}
          value={loggingLevel}
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
};
