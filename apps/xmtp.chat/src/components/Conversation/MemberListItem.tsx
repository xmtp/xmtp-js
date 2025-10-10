import { Box } from "@mantine/core";
import { MemberCard } from "@/components/Conversation/MemberCard";
import { MemberPopover } from "@/components/Conversation/MemberPopover";

export type MemberListItemProps = {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  inboxId: string;
  isDm?: boolean;
};

export const MemberListItem: React.FC<MemberListItemProps> = ({
  address,
  avatar,
  description,
  displayName,
  inboxId,
  isDm,
}) => {
  return (
    <Box px="sm">
      <MemberPopover
        position="left"
        address={address}
        inboxId={inboxId}
        displayName={displayName}
        avatar={avatar}
        description={description}
        showDm={!isDm}>
        <MemberCard
          address={address}
          displayName={displayName}
          avatar={avatar}
          description={description}
        />
      </MemberPopover>
    </Box>
  );
};
