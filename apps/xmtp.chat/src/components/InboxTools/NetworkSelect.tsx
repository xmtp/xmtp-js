import { Group, NativeSelect, Text, Tooltip } from "@mantine/core";
import { ApiUrls, type XmtpEnv } from "@xmtp/browser-sdk";
import { useSettings } from "@/hooks/useSettings";

export const NetworkSelect: React.FC = () => {
  const { environment, setEnvironment } = useSettings();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setEnvironment(event.currentTarget.value as XmtpEnv);
  };

  return (
    <Group gap="xs" justify="space-between">
      <Text fw="bold">XMTP network</Text>
      <Tooltip
        label={ApiUrls[environment]}
        withArrow
        events={{ hover: true, focus: true, touch: true }}>
        <NativeSelect
          data={["local", "dev", "production"]}
          value={environment}
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
};
