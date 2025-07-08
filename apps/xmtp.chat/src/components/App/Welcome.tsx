import {
  Anchor,
  Button,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { Connect } from "@/components/App/Connect";
import { Settings } from "@/components/App/Settings";
import { useConnectXmtp } from "@/hooks/useConnectXmtp";
import { useRedirect } from "@/hooks/useRedirect";

export const Welcome = () => {
  const navigate = useNavigate();
  const { redirectUrl, setRedirectUrl } = useRedirect();
  const { client, loading } = useConnectXmtp();
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
    <>
      <LoadingOverlay visible={loading} />
      <Stack gap="xl" py={40} px={px} align="center">
        <Stack gap="md" align="center">
          <Title order={1}>XMTP.chat is built for developers</Title>
          <Text fs="italic" size="xl">
            Learn to build with XMTP — using an app built with XMTP
          </Text>
        </Stack>
        <Stack gap="md">
          <Title order={3} ml="sm">
            Settings
          </Title>
          <Settings />
          <Connect />
          <Title order={3}>Installation management</Title>
          <Text>
            Use this tool to manage your installations without an XMTP client.
          </Text>
          <Group justify="center">
            <Button size="md" onClick={handleInboxToolsClick}>
              Launch installation management
            </Button>
          </Group>
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
      </Stack>
      <Outlet />
    </>
  );
};
