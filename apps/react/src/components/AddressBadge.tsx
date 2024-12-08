import { Badge, Flex, Text, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { shortAddress } from "../helpers/address";

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
};

export const AddressBadge: React.FC<AddressBadgeProps> = ({ address }) => {
  const clipboard = useClipboard({ timeout: 1000 });

  const handleCopy = () => {
    clipboard.copy(address);
  };

  const handleKeyboardCopy = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleCopy();
    }
  };

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
        size="lg"
        radius="md"
        onKeyDown={handleKeyboardCopy}
        onClick={handleCopy}
        miw={100}
        tabIndex={0}
        styles={{
          label: {
            textTransform: "none",
          },
        }}
        flex="1 0">
        {shortAddress(address)}
      </Badge>
    </Tooltip>
  );
};
