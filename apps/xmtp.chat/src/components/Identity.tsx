import { type MantineStyleProps } from "@mantine/core";
import {
  MemberPopover,
  type MemberPopoverProps,
} from "@/components/Conversation/MemberPopover";
import {
  IdentityBadge,
  type IdentityBadgeProps,
} from "@/components/IdentityBadge";

export type IdentityProps = MemberPopoverProps &
  Pick<IdentityBadgeProps, "size"> & {} & Pick<MantineStyleProps, "w">;

export const Identity: React.FC<IdentityProps> = ({
  size = "lg",
  w,
  ...props
}) => {
  return (
    <MemberPopover {...props}>
      <IdentityBadge
        address={props.address}
        displayName={props.displayName}
        size={size}
        w={w}
      />
    </MemberPopover>
  );
};
