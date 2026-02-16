import { Group, NativeSelect, Text, Tooltip } from "@mantine/core";
import { ApiUrls } from "@xmtp/browser-sdk";
import { getD14nGatewayHost, isD14nEnv, type AppEnv } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";

const networkOptions = [
  { value: "local", label: "Local" },
  { value: "dev", label: "Dev" },
  { value: "production", label: "Production" },
  { value: "d14n-dev", label: "D14N Dev" },
  { value: "d14n-staging", label: "D14N Staging" },
  { value: "testnet", label: "D14N Testnet" },
];

const getNetworkUrl = (env: AppEnv): string => {
  if (isD14nEnv(env)) return getD14nGatewayHost(env);
  return ApiUrls[env as keyof typeof ApiUrls];
};

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
