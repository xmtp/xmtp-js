import { Box, Button, Flex, Group, Paper, Text, Tooltip } from "@mantine/core";
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

export type ConnectedAddressProps = {
  address: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
};

export const ConnectedAddress: React.FC<ConnectedAddressProps> = ({
  address,
  size = "lg",
  onClick,
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
    <Group align="center" gap="xs">
      <GlowingCircle />
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
        <Text
          size={size}
          fw={700}
          onKeyDown={handleKeyboardCopy}
          onClick={handleCopy}
          tabIndex={0}>
          {shortAddress(address.toLowerCase())}
        </Text>
      </Tooltip>
      <Button size="xs" variant="default" onClick={onClick}>
        Disconnect
      </Button>
    </Group>
  );
};
