import { type MantineStyleProps } from "@mantine/core";
import {
  MemberPopover,
  type MemberPopoverProps,
} from "@/components/Conversation/MemberPopover";
import {
  IdentityBadge,
  type IdentityBadgeProps,
} from "@/components/IdentityBadge";

export type IdentityProps = {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  inboxId: string;
  showDm?: boolean;
  size?: IdentityBadgeProps["size"];
  position?: MemberPopoverProps["position"];
} & Pick<MantineStyleProps, "w">;

export const Identity: React.FC<IdentityProps> = ({
  address,
  avatar,
  description,
  displayName,
  inboxId,
  showDm,
  size = "lg",
  position,
  w,
}) => {
  return (
    <MemberPopover
      address={address}
      avatar={avatar}
      description={description}
      displayName={displayName}
      inboxId={inboxId}
      showDm={showDm}
      position={position}>
      <IdentityBadge
        address={address}
        displayName={displayName}
        size={size}
        w={w}
      />
    </MemberPopover>
  );
};
