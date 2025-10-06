import type { SafeGroupMember } from "@xmtp/browser-sdk";

export const getMemberAddress = (member: SafeGroupMember) => {
  return member.accountIdentifiers[0].identifier;
};
