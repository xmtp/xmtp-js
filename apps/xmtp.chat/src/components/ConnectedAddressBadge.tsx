import { Box, Flex, Group, Paper, Text, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useCallback } from "react";
import { shortAddress } from "@/helpers/strings";

const GlowingCircle = () => {
  return (
    <Box
      w={6}
      h={6}
      bg="green.6"
      style={{
        borderRadius: "50%",
        boxShadow: "0px 0px 2px 2px var(--mantine-color-green-9)",
      }}
    />
  );
};

export type AddressTooltipLabelProps = {
  address: string;
};

export const AddressTooltipLabel: React.FC<AddressTooltipLabelProps> = ({
  address,
}) => {
  return (
    <Flex direction="column">
      <Text size="sm">{address}</Text>
      <Text size="xs" c="dimmed" ta="center">
        click to copy
      </Text>
    </Flex>
  );
};

export type ConnectedAddressBadgeProps = {
  address: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export const ConnectedAddressBadge: React.FC<ConnectedAddressBadgeProps> = ({
  address,
  size = "lg",
}) => {
  const clipboard = useClipboard({ timeout: 1000 });

  const handleCopy = useCallback(
    (
      event:
        | React.MouseEvent<HTMLDivElement>
        | React.KeyboardEvent<HTMLDivElement>,
    ) => {
      event.stopPropagation();
      clipboard.copy(address);
    },
    [clipboard, address],
  );

  const handleKeyboardCopy = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        handleCopy(event);
      }
    },
    [handleCopy],
  );

  return (
    <Tooltip
      label={
        clipboard.copied ? (
          <Text size="xs">Copied!</Text>
        ) : (
          <AddressTooltipLabel address={address.toLowerCase()} />
        )
      }
      withArrow
      events={{ hover: true, focus: true, touch: true }}>
      <Paper
        withBorder
        p={0}
        variant="default"
        radius="md"
        onKeyDown={handleKeyboardCopy}
        onClick={handleCopy}
        miw={100}
        tabIndex={0}>
        <Group align="center" gap="xs" px="sm" py={4}>
          <GlowingCircle />
          <Text size={size} fw={700}>
            {shortAddress(address.toLowerCase())}
          </Text>
        </Group>
      </Paper>
    </Tooltip>
  );
};
