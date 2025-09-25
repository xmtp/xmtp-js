import {
  Badge,
  Popover,
  Stack,
  Text,
  type MantineStyleProps,
} from "@mantine/core";
import { useState } from "react";
import { BadgeWithCopy } from "@/components/BadgeWithCopy";
import { shortAddress } from "@/helpers/strings";
import { useProfiles } from "@/stores/profiles";

export type IdentityProps = {
  inboxId: string;
  address: string;
  displayName?: string;
  shorten?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
} & Pick<MantineStyleProps, "w">;

export const Identity: React.FC<IdentityProps> = ({
  inboxId,
  address,
  displayName,
  size = "lg",
  shorten = true,
  w,
}) => {
  const [opened, setOpened] = useState(false);
  const profiles = useProfiles(address);
  const label =
    displayName || (profiles.length > 0 ? profiles[0].displayName : null);
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
          w={w}
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
          {label ||
            (shorten ? shortAddress(address || inboxId) : address || inboxId)}
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
