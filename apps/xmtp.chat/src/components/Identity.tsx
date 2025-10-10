import { type MantineStyleProps } from "@mantine/core";
import { MemberPopover } from "@/components/Conversation/MemberPopover";
import { IdentityBadge } from "@/components/IdentityBadge";

export type IdentityProps = {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  inboxId: string;
  isDm?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
} & Pick<MantineStyleProps, "w">;

export const Identity: React.FC<IdentityProps> = ({
  address,
  avatar,
  description,
  displayName,
  inboxId,
  isDm,
  size = "lg",
  w,
}) => {
  return (
    <MemberPopover
      address={address}
      avatar={avatar}
      description={description}
      displayName={displayName}
      inboxId={inboxId}
      showDm={!isDm}>
      <IdentityBadge
        address={address}
        displayName={displayName}
        size={size}
        w={w}
      />
    </MemberPopover>
  );
};
