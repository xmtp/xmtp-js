import {
  Anchor,
  Badge,
  Button,
  List,
  Stack,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import type { XmtpEnv } from "@xmtp/browser-sdk";
import { useRefManager } from "./RefManager";

export const Welcome = () => {
  const { getRef } = useRefManager();
  const [network] = useLocalStorage<XmtpEnv>({
    key: "XMTP_NETWORK",
    defaultValue: "dev",
  });

  const px = useMatches({
    base: "5%",
    sm: "10%",
  });

  return (
    <Stack gap={60} py={40} px={px} align="center">
      <Stack gap="lg" align="center">
        <Title order={1}>XMTP.chat is built for devs, by devs</Title>
        <Title order={2} fw={400} fs="italic">
          Learn to build with XMTP—using an app built with XMTP
        </Title>
      </Stack>
      <Stack gap="lg">
        <Title order={3}>Get started</Title>
        <List type="ordered" withPadding>
          <List.Item>
            Click{" "}
            <Button
              size="xs"
              px={6}
              onClick={() => {
                getRef("connect-wallet-button")?.current?.click();
              }}>
              Connect
            </Button>{" "}
            to connect a wallet to the{" "}
            <Badge variant="default" size="lg" radius="md">
              {network}
            </Badge>{" "}
            network
          </List.Item>
          <List.Item>
            To use an ephemeral wallet, switch networks, or enable logging click{" "}
            <Button
              size="xs"
              px={6}
              variant="default"
              onClick={() => {
                getRef("settings-button")?.current?.click();
              }}>
              Settings
            </Button>
          </List.Item>
        </List>
        <Title order={3}>Feedback</Title>
        <Text>
          Your feedback is incredibly important to the success of this tool. If
          you find any bugs or have suggestions, please let us know by{" "}
          <Anchor href="https://github.com/xmtp/xmtp-chat/issues">
            filing an issue
          </Anchor>{" "}
          on GitHub.
        </Text>
      </Stack>
    </Stack>
  );
};
