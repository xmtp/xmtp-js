import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import { Dm } from "@xmtp/browser-sdk";
import { useMemo, type ComponentProps } from "react";
import { Virtuoso } from "react-virtuoso";
import { MemberListItem } from "@/components/Conversation/MemberListItem";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";
import { IconPlus } from "@/icons/IconPlus";
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
  const { members, admins, superAdmins, conversation } =
    useConversation(conversationId);
  const profiles = useAllProfiles();
  const membersListItems = useMemo(() => {
    const items: (MembersListTitle | MembersListProfile)[] = [];

    const actualSuperAdmins = superAdmins.filter((inboxId) =>
      members.has(inboxId),
    );
    const actualAdmins = admins.filter((inboxId) => members.has(inboxId));

    if (actualSuperAdmins.length > 0) {
      items.push({ title: "Super admins", count: actualSuperAdmins.length });
      for (const inboxId of actualSuperAdmins) {
        const member = members.get(inboxId);
        if (member) {
          const address = getMemberAddress(member);
          const profile = combineProfiles(address, profiles.get(address) ?? []);
          items.push({
            address,
            avatar: profile.avatar,
            description: profile.description,
            displayName: profile.displayName,
            inboxId: member.inboxId,
          });
        }
      }
    }

    if (actualAdmins.length > 0) {
      items.push({ title: "Admins", count: actualAdmins.length });
      for (const inboxId of actualAdmins) {
        const member = members.get(inboxId);
        if (member) {
          const address = getMemberAddress(member);
          const profile = combineProfiles(address, profiles.get(address) ?? []);
          items.push({
            address,
            avatar: profile.avatar,
            description: profile.description,
            displayName: profile.displayName,
            inboxId: member.inboxId,
          });
        }
      }
    }

    if (members.size - actualSuperAdmins.length - actualAdmins.length > 0) {
      items.push({
        title: "Members",
        count: members.size - actualSuperAdmins.length - actualAdmins.length,
      });
      for (const inboxId of members.keys()) {
        if (
          !actualSuperAdmins.includes(inboxId) &&
          !actualAdmins.includes(inboxId)
        ) {
          const member = members.get(inboxId);
          if (member) {
            const address = getMemberAddress(member);
            const profile = combineProfiles(
              address,
              profiles.get(address) ?? [],
            );
            items.push({
              address,
              avatar: profile.avatar,
              description: profile.description,
              displayName: profile.displayName,
              inboxId: member.inboxId,
            });
          }
        }
      }
    }
    return items;
  }, [members, profiles, superAdmins, admins]);

  return (
    <Stack gap={0} style={{ flexGrow: 1 }}>
      <ContentLayoutHeader
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
            <Tooltip label={<Text size="xs">Add members</Text>}>
              <ActionIcon variant="default">
                <IconPlus />
              </ActionIcon>
            </Tooltip>
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
      <ContentLayoutContent withScrollArea={false} withScrollFade>
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
                description={item.description}
                displayName={item.displayName}
                inboxId={item.inboxId}
                isDm={conversation instanceof Dm}
              />
            );
          }}
        />
      </ContentLayoutContent>
    </Stack>
  );
};
