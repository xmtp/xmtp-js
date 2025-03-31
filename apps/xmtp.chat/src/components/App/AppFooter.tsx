import { Anchor, Box, Flex, Group, Image, Text } from "@mantine/core";
import logo from "@/assets/xmtp-icon.png";

export const AppFooter: React.FC = () => {
  return (
    <Group justify="space-between" align="center" wrap="nowrap">
      <Box>
        <Anchor
          href="https://xmtp.org"
          underline="never"
          c="var(--mantine-color-text)"
          target="_blank"
          flex={0}>
          <Flex align="center" py="md" display="inline-flex">
            <Image src={logo} alt="XMTP" w="24px" h="24px" fit="contain" />
            <Text size="xl" fw={700} ml="xs">
              XMTP
            </Text>
          </Flex>
        </Anchor>
      </Box>
      <Group gap="xs">
        <Anchor
          display="block"
          target="_blank"
          underline="hover"
          c="var(--mantine-color-text)"
          href="https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md">
          Contribute
        </Anchor>
        <Text size="sm" c="dimmed">
          •
        </Text>
        <Anchor
          display="block"
          target="_blank"
          underline="hover"
          c="var(--mantine-color-text)"
          href="https://github.com/xmtp/xmtp-js/issues/new/choose">
          Report an issue
        </Anchor>
        <Text size="sm" c="dimmed">
          •
        </Text>
        <Anchor
          display="block"
          target="_blank"
          href="https://docs.xmtp.org/"
          underline="hover"
          c="var(--mantine-color-text)">
          Documentation
        </Anchor>
        <Text size="sm" c="dimmed">
          •
        </Text>
        <Anchor
          display="block"
          target="_blank"
          underline="hover"
          c="var(--mantine-color-text)"
          href="https://community.xmtp.org/">
          Forums
        </Anchor>
      </Group>
    </Group>
  );
};
