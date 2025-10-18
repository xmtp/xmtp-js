import { Badge, Group, Stack, Text } from "@mantine/core";
import { type SafeGroupMember } from "@xmtp/browser-sdk";
import { useCallback } from "react";
import { Member } from "@/components/Conversation/Member";
import { getMemberAddress } from "@/helpers/xmtp";

export type RemoveMembersProps = {
  removedMembers: SafeGroupMember[];
  onMembersRemoved?: (members: SafeGroupMember[]) => void;
};

export const RemoveMembers: React.FC<RemoveMembersProps> = ({
  removedMembers,
  onMembersRemoved,
}) => {
  const handleRestoreRemovedMember = useCallback(
    (inboxId: string) => {
      const newRemovedMembers = removedMembers.filter(
        (m) => m.inboxId !== inboxId,
      );
      if (newRemovedMembers.length === removedMembers.length) {
        return;
      }
      onMembersRemoved?.(newRemovedMembers);
    },
    [removedMembers],
  );

  return (
    <>
      <Group gap="xs">
        <Text fw={700}>Removed members</Text>
        <Badge color="gray" size="lg">
          {removedMembers.length}
        </Badge>
      </Group>
      <Stack gap="4px">
        {removedMembers.map((member) => (
          <Member
            key={member.inboxId}
            buttonLabel="Restore"
            address={getMemberAddress(member)}
            displayName=""
            avatar={null}
            description={null}
            onClick={() => {
              handleRestoreRemovedMember(member.inboxId);
            }}
          />
        ))}
      </Stack>
    </>
  );
};
