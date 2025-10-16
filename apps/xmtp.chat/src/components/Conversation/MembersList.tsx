import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import { Dm, type SafeGroupMember } from "@xmtp/browser-sdk";
import { useMemo, type ComponentProps } from "react";
import { Virtuoso } from "react-virtuoso";
import { MemberListItem } from "@/components/Conversation/MemberListItem";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";
import { IconX } from "@/icons/IconX";
import {
  ContentLayoutContent,
  ContentLayoutHeader,
} from "@/layouts/ContentLayout";
import { combineProfiles, useAllProfiles } from "@/stores/profiles";
import classes from "./MembersList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type MembersListProps = {
  conversationId: string;
  toggle: () => void;
};

type MembersListTitle = {
  title: string;
  count: number;
};

type MembersListProfile = {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  inboxId: string;
  permissionLevel: SafeGroupMember["permissionLevel"];
};

const isMembersListTitle = (
  item: MembersListTitle | MembersListProfile,
): item is MembersListTitle => {
  return "title" in item && "count" in item;
};

type TitleCardProps = {
  title: string;
  count: number;
};

const TitleCard: React.FC<TitleCardProps> = ({ title, count }) => {
  return (
    <Group
      justify="space-between"
      gap="xs"
      align="center"
      wrap="nowrap"
      px="md">
      <Text size="xs" fw={700}>
        {title.toUpperCase()}
      </Text>
      <Badge color="gray" size="sm">
        {count}
      </Badge>
    </Group>
  );
};

export const MembersList: React.FC<MembersListProps> = ({
  conversationId,
  toggle,
}) => {
  const { members, conversation } = useConversation(conversationId);
  const profiles = useAllProfiles();
  const membersListItems = useMemo(() => {
    const items: (MembersListTitle | MembersListProfile)[] = [];

    const membersList = Array.from(members.values());
    const superAdmins = membersList.filter(
      // @ts-expect-error - the types are wrong
      (member) => member.permissionLevel === "SuperAdmin",
    );

    if (superAdmins.length > 0) {
      items.push({ title: "Super admins", count: superAdmins.length });
      for (const member of superAdmins) {
        const address = getMemberAddress(member);
        const profile = combineProfiles(address, profiles.get(address) ?? []);
        items.push({
          address,
          avatar: profile.avatar,
          description: profile.description,
          displayName: profile.displayName,
          inboxId: member.inboxId,
          permissionLevel: member.permissionLevel,
        });
      }
    }

    const admins = membersList.filter(
      // @ts-expect-error - the types are wrong
      (member) => member.permissionLevel === "Admin",
    );

    if (admins.length > 0) {
      items.push({ title: "Admins", count: admins.length });
      for (const member of admins) {
        const address = getMemberAddress(member);
        const profile = combineProfiles(address, profiles.get(address) ?? []);
        items.push({
          address,
          avatar: profile.avatar,
          description: profile.description,
          displayName: profile.displayName,
          inboxId: member.inboxId,
          permissionLevel: member.permissionLevel,
        });
      }
    }

    const regulars = membersList.filter(
      // @ts-expect-error - TODO: the types are wrong
      (member) => member.permissionLevel === "Member",
    );

    if (regulars.length > 0) {
      items.push({
        title: "Members",
        count: regulars.length,
      });
      for (const member of regulars) {
        const address = getMemberAddress(member);
        const profile = combineProfiles(address, profiles.get(address) ?? []);
        items.push({
          address,
          avatar: profile.avatar,
          description: profile.description,
          displayName: profile.displayName,
          inboxId: member.inboxId,
          permissionLevel: member.permissionLevel,
        });
      }
    }

    return items;
  }, [members, profiles]);

  return (
    <Stack gap={0} style={{ flexGrow: 1 }}>
      <ContentLayoutHeader
        className={classes.header}
        title={
          <Group align="center" gap="xs">
            <Text size="md" fw={700}>
              Members
            </Text>
            <Badge color="gray" size="lg">
              {members.size}
            </Badge>
          </Group>
        }
        headerActions={
          <Group align="center" gap="xxxs">
            <Tooltip label={<Text size="xs">Hide members</Text>}>
              <ActionIcon
                variant="default"
                onClick={toggle}
                className={classes.hideMembers}>
                <IconX />
              </ActionIcon>
            </Tooltip>
          </Group>
        }
      />
      <ContentLayoutContent
        withScrollArea={false}
        withScrollFade
        className={classes.content}>
        <Virtuoso
          components={{
            List,
          }}
          style={{ flexGrow: 1 }}
          data={membersListItems}
          itemContent={(_, item) => {
            if (isMembersListTitle(item)) {
              return <TitleCard title={item.title} count={item.count} />;
            }
            return (
              <MemberListItem
                address={item.address}
                avatar={item.avatar}
                conversationId={conversationId}
                description={item.description}
                displayName={item.displayName}
                inboxId={item.inboxId}
                permissionLevel={item.permissionLevel}
                showDm={!(conversation instanceof Dm)}
              />
            );
          }}
        />
      </ContentLayoutContent>
    </Stack>
  );
};
