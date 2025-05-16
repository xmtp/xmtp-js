import {
  Anchor,
  LoadingOverlay,
  Stack,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { Outlet } from "react-router";
import { useConnect } from "wagmi";
import { Connect } from "@/components/App/Connect";
import { Settings } from "@/components/App/Settings";
import { useXMTP } from "@/contexts/XMTPContext";

export const Welcome = () => {
  const { status } = useConnect();
  const { initializing } = useXMTP();
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });

  const isBusy = status === "pending" || initializing;

  return (
    <>
      <LoadingOverlay visible={isBusy} />
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
