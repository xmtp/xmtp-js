import { Flex, NativeSelect, Text } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { type ClientOptions } from "@xmtp/browser-sdk";
import { useDisconnect } from "wagmi";
import { useClient } from "../hooks/useClient";

export const LoggingSelect: React.FC = () => {
  const { disconnect } = useDisconnect();
  const { disconnect: disconnectClient } = useClient();
  const [logging, setLogging] = useLocalStorage<ClientOptions["loggingLevel"]>({
    key: "XMTP_LOGGING_LEVEL",
    defaultValue: "off",
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLogging(event.currentTarget.value as ClientOptions["loggingLevel"]);
    disconnect(undefined, {
      onSuccess: () => {
        disconnectClient();
      },
    });
  };

  return (
    <Flex align="center" gap="xs" justify="space-between" w="100%">
      <Text size="sm" fw={700}>
        LOGGING
      </Text>
      <NativeSelect
        variant="filled"
        data={["off", "error", "warn", "info", "debug", "trace"]}
        value={logging}
        onChange={handleChange}
      />
    </Flex>
  );
};
