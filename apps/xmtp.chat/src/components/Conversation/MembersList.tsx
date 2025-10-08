import { Stack, Text } from "@mantine/core";
import { useMemo, type ComponentProps } from "react";
import { Virtuoso } from "react-virtuoso";
import { getMemberAddress } from "@/helpers/xmtp";
import { useConversation } from "@/hooks/useConversation";
import {
  ContentLayoutContent,
  ContentLayoutHeader,
} from "@/layouts/ContentLayout";
import { useProfileActions } from "@/stores/profiles";
import classes from "./MembersList.module.css";

const List = (props: ComponentProps<"div">) => {
  return <div className={classes.root} {...props} />;
};

export type MembersListProps = {
  conversationId: string;
};

export const MembersList = ({ conversationId }: MembersListProps) => {
  const { members, admins, superAdmins, permissions } =
    useConversation(conversationId);
  const { findProfiles } = useProfileActions();
  const profiles = findProfiles(
    Array.from(members.values()).map((m) => getMemberAddress(m)),
  );
  const membersArray = useMemo(() => Array.from(members.values()), [members]);
  return (
    <Stack gap={0} style={{ flexGrow: 1 }}>
      <ContentLayoutHeader title="Members" />
      <ContentLayoutContent
        withScrollArea={false}
        withScrollAreaPadding
        withScrollFade>
        <Virtuoso
          components={{
            List,
          }}
          style={{ flexGrow: 1 }}
          data={membersArray}
          itemContent={(_, member) => (
            <Text truncate="end">{getMemberAddress(member)}</Text>
          )}
        />
      </ContentLayoutContent>
    </Stack>
  );
};
