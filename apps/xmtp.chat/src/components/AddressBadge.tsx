import { Badge, Flex, Text, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useCallback } from "react";
import { shortAddress } from "@/helpers/strings";

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

export type AddressBadgeProps = {
  address: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export const AddressBadge: React.FC<AddressBadgeProps> = ({
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
          <AddressTooltipLabel address={address} />
        )
      }
      withArrow
      events={{ hover: true, focus: true, touch: true }}>
      <Badge
        variant="default"
        size={size}
        radius="md"
        onKeyDown={handleKeyboardCopy}
        onClick={handleCopy}
        miw={100}
        tabIndex={0}
        styles={{
          label: {
            textTransform: "none",
          },
        }}>
        {shortAddress(address)}
      </Badge>
    </Tooltip>
  );
};
