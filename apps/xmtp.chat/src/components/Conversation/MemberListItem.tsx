import { Box } from "@mantine/core";
import { MemberCard } from "@/components/Conversation/MemberCard";
import {
  MemberPopover,
  type MemberPopoverProps,
} from "@/components/Conversation/MemberPopover";

export type MemberListItemProps = MemberPopoverProps;

export const MemberListItem: React.FC<MemberListItemProps> = (props) => {
  return (
    <Box px="sm">
      <MemberPopover {...props} position="left">
        <MemberCard
          address={props.address}
          displayName={props.displayName}
          avatar={props.avatar}
          description={props.description}
        />
      </MemberPopover>
    </Box>
  );
};
