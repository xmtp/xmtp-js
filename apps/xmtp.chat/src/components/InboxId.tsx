import { Button, Popover, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { shortAddress } from "@/helpers/strings";

export type InboxIdBadgeProps = {
  inboxId: string;
  address: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export const InboxIdBadge: React.FC<InboxIdBadgeProps> = ({
  inboxId,
  address,
  size = "lg",
}) => {
  const [opened, setOpened] = useState(false);
  return (
    <Popover
      width={300}
      position="bottom"
      withArrow
      shadow="md"
      trapFocus
      opened={opened}
      onChange={setOpened}>
      <Popover.Target>
        <Button
          variant="default"
          size={size}
          radius="md"
          miw={100}
          onClick={(e) => {
            e.stopPropagation();
            setOpened((o) => !o);
          }}>
          {shortAddress(inboxId)}
        </Button>
      </Popover.Target>
      <Popover.Dropdown
        p="xs"
        onClick={(e) => {
          e.stopPropagation();
        }}>
        <Stack gap="xs">
          <Text truncate size="sm" ml="xs">
            Inbox ID
          </Text>
          <BadgeWithCopy value={inboxId} />
          <Text truncate size="sm" ml="xs">
            Address
          </Text>
          <BadgeWithCopy value={address} />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
