import { Badge, Popover, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { shortAddress } from "@/helpers/strings";
import { useProfiles } from "@/stores/profiles";

export type IdentityProps = {
  inboxId: string;
  address: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export const Identity: React.FC<IdentityProps> = ({
  inboxId,
  address,
  size = "lg",
}) => {
  const [opened, setOpened] = useState(false);
  const profiles = useProfiles(address);
  const displayName =
    profiles.length > 0
      ? profiles[0].displayName || shortAddress(address || inboxId)
      : shortAddress(address || inboxId);
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
        <Badge
          radius="md"
          variant="default"
          size={size}
          tabIndex={0}
          styles={{
            label: {
              textTransform: "none",
            },
            root: {
              cursor: "pointer",
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpened((o) => !o);
          }}>
          {displayName}
        </Badge>
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
