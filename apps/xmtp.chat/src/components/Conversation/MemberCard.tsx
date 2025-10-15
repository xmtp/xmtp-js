import { Avatar, Card, Group, Stack, Text } from "@mantine/core";
import { forwardRef } from "react";
import { useMemberPopover } from "@/components/Conversation/MemberPopover";
import { shortAddress } from "@/helpers/strings";
import classes from "./MemberCard.module.css";

export type MemberCardProps = {
  address: string;
  displayName: string | null;
  avatar: string | null;
  description: string | null;
};

export const MemberCard = forwardRef<HTMLDivElement, MemberCardProps>(
  ({ address, displayName, avatar, description }, ref) => {
    const { setOpened } = useMemberPopover();
    return (
      <Card
        ref={ref}
        shadow="sm"
        px="xxxs"
        py="xxs"
        radius="md"
        withBorder
        onClick={() => {
          setOpened((o) => !o);
        }}
        className={classes.member}
        tabIndex={0}>
        <Group gap="xxs" align="center" wrap="nowrap">
          <Avatar src={avatar} size="md" radius="xl" variant="default" />
          <Stack gap="0" flex={1} style={{ overflow: "hidden" }}>
            <Text size="sm" truncate>
              {displayName || shortAddress(address)}
            </Text>
            <Text size="xs" truncate c="dimmed">
              {description}
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  },
);

MemberCard.displayName = "MemberCard";
