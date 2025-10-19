import { Badge, Group, Stack, Text } from "@mantine/core";
import { useCallback } from "react";
import { Member } from "@/components/Conversation/Member";
import type { MemberProfile } from "@/hooks/useMemberProfiles";

export type RemoveMembersProps = {
  removedMembers: MemberProfile[];
  onMembersRemoved?: (members: MemberProfile[]) => void;
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
      <Group gap="xs" justify="space-between" align="center">
        <Text fw={700}>Removed members</Text>
        <Badge color="gray" size="lg">
          {removedMembers.length}
        </Badge>
      </Group>
      {removedMembers.length > 0 && (
        <Stack gap="4px">
          {removedMembers.map((member) => (
            <Member
              key={member.inboxId}
              buttonLabel="Restore"
              address={member.address}
              displayName={member.displayName}
              avatar={member.avatar}
              description={member.description}
              onClick={() => {
                handleRestoreRemovedMember(member.inboxId);
              }}
            />
          ))}
        </Stack>
      )}
    </>
  );
};
