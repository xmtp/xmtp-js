import { Flex, NativeSelect, Text } from "@mantine/core";
import { type ClientOptions } from "@xmtp/browser-sdk";
import { useSettings } from "@/hooks/useSettings";

export type LoggingSelectProps = {
  disabled?: boolean;
};

export const LoggingSelect: React.FC<LoggingSelectProps> = ({ disabled }) => {
  const { loggingLevel, setLoggingLevel } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoggingLevel(event.currentTarget.value as ClientOptions["loggingLevel"]);
  };

  return (
    <Flex align="center" gap="xs">
      <Text size="sm" fw={700}>
        LOGGING
      </Text>
      <NativeSelect
        data={["off", "error", "warn", "info", "debug", "trace"]}
        value={loggingLevel}
        onChange={handleChange}
        disabled={disabled}
      />
    </Flex>
  );
};
