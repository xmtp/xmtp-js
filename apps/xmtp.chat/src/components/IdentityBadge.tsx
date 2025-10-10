import { Badge, type MantineStyleProps } from "@mantine/core";
import { forwardRef } from "react";
import { useMemberPopover } from "@/components/Conversation/MemberPopover";
import { shortAddress } from "@/helpers/strings";

export type IdentityBadgeProps = {
  address: string;
  displayName: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
} & Pick<MantineStyleProps, "w">;

export const IdentityBadge = forwardRef<HTMLDivElement, IdentityBadgeProps>(
  ({ address, displayName, size = "lg", w }, ref) => {
    const { setOpened } = useMemberPopover();
    return (
      <Badge
        ref={ref}
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
        {displayName || shortAddress(address)}
      </Badge>
    );
  },
);
