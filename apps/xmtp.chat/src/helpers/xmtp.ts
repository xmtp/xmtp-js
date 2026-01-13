import type { GroupMember } from "@xmtp/browser-sdk";

export const getMemberAddress = (member: GroupMember) => {
  return member.accountIdentifiers[0].identifier;
};
