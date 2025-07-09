import {
  Anchor,
  Button,
  Group,
  Stack,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { ConnectXMTP } from "@/components/App/ConnectXMTP";
import { DisableAnalytics } from "@/components/App/DisableAnalytics";
import { WalletConnect } from "@/components/App/WalletConnect";
import { ConnectedAddressBadge } from "@/components/ConnectedAddressBadge";
import { useXMTP } from "@/contexts/XMTPContext";
import { useConnectWallet } from "@/hooks/useConnectWallet";
import { useRedirect } from "@/hooks/useRedirect";

export const Welcome = () => {
  const { isConnected, address } = useConnectWallet();
  const { client } = useXMTP();
  const navigate = useNavigate();
  const { redirectUrl, setRedirectUrl } = useRedirect();
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });

  // redirect if there's already a client
  useEffect(() => {
    if (client) {
      if (redirectUrl) {
        setRedirectUrl("");
        void navigate(redirectUrl);
      } else {
        void navigate("/");
      }
    }
  }, [client]);

  const handleInboxToolsClick = useCallback(() => {
    void navigate("/inbox-tools");
  }, [navigate]);

  return (
    <Stack gap="xl" py={40} px={px}>
      <Stack gap="md" align="center">
        <Title order={1}>XMTP.chat is built for developers</Title>
        <Text fs="italic" size="xl">
          Learn to build with XMTP — using an app built with XMTP
        </Text>
      </Stack>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3} ml="sm">
            Connect your wallet
          </Title>
          {isConnected && address && (
            <ConnectedAddressBadge address={address} size="sm" />
          )}
        </Group>
        <WalletConnect />
      </Stack>
      <Stack gap="md">
        <Title order={3} ml="sm">
          Connect to XMTP
        </Title>
        <ConnectXMTP />
      </Stack>
      <Stack gap="md">
        <Title order={3}>Installation management</Title>
        <Text>
          Use this tool to manage your installations without an XMTP client.
        </Text>
        <Group justify="center">
          <Button size="md" onClick={handleInboxToolsClick}>
            Launch installation management
          </Button>
        </Group>
      </Stack>
      <Stack gap="md">
        <Title order={3}>Feedback</Title>
        <Stack gap="md">
          <Text>
            Your feedback is incredibly important to the success of this tool.
            If you find any bugs or have suggestions, please let us know by{" "}
            <Anchor
              href="https://github.com/xmtp/xmtp-js/issues/new/choose"
              target="_blank">
              filing an issue
            </Anchor>{" "}
            on GitHub.
          </Text>
          <Text>
            Check out the official{" "}
            <Anchor href="https://docs.xmtp.org/" target="_blank">
              documentation
            </Anchor>{" "}
            for more information on how to build with XMTP.
          </Text>
          <Text>
            If you have other questions about XMTP, visit our{" "}
            <Anchor href="https://community.xmtp.org/" target="_blank">
              community forums
            </Anchor>
            .
          </Text>
        </Stack>
      </Stack>
      <DisableAnalytics />
    </Stack>
  );
};
