import type { SafeGroupMember } from "@xmtp/browser-sdk";
import { useMemo } from "react";
import { getMemberAddress } from "@/helpers/xmtp";
import { combineProfiles, useAllProfiles } from "@/stores/profiles";

export type MemberProfile = SafeGroupMember & {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
};

export const useMemberProfiles = (
  members: SafeGroupMember[],
): MemberProfile[] => {
  const profiles = useAllProfiles();
  return useMemo(() => {
    return members.map((member) => {
      const address = getMemberAddress(member);
      return {
        ...member,
        ...combineProfiles(address, profiles.get(address) ?? []),
      };
    });
  }, [members, profiles]);
};
