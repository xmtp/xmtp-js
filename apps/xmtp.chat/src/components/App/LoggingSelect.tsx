import { Group, NativeSelect, Stack, Text } from "@mantine/core";
import { LogLevel } from "@xmtp/browser-sdk";
import { useSettings } from "@/hooks/useSettings";

const loggingLevelStringToEnum = {
  Off: LogLevel.Off,
  Error: LogLevel.Error,
  Warn: LogLevel.Warn,
  Info: LogLevel.Info,
  Debug: LogLevel.Debug,
  Trace: LogLevel.Trace,
};

const loggingLevelEnumToString = {
  [LogLevel.Off]: "Off",
  [LogLevel.Error]: "Error",
  [LogLevel.Warn]: "Warn",
  [LogLevel.Info]: "Info",
  [LogLevel.Debug]: "Debug",
  [LogLevel.Trace]: "Trace",
};

export const LoggingSelect: React.FC = () => {
  const { loggingLevel, setLoggingLevel } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoggingLevel(
      loggingLevelStringToEnum[
        event.currentTarget.value as keyof typeof loggingLevelStringToEnum
      ],
    );
  };

  return (
    <Stack gap="xs">
      <Group gap="xs" justify="space-between">
        <Text fw="bold" size="lg">
          Logging level
        </Text>
        <NativeSelect
          data={Object.keys(loggingLevelStringToEnum)}
          value={loggingLevelEnumToString[loggingLevel ?? LogLevel.Off]}
          onChange={handleChange}
        />
      </Group>
      <Text size="sm">Enable logging to help debug issues</Text>
    </Stack>
  );
};
