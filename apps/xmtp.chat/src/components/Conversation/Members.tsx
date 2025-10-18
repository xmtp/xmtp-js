import { Badge, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { type SafeGroupMember } from "@xmtp/browser-sdk";
import { useCallback, useMemo } from "react";
import {
  AddMembers,
  type AddMembersProps,
  type PendingMember,
} from "@/components/Conversation/AddMembers";
import { Member } from "@/components/Conversation/Member";
import { RemoveMembers } from "@/components/Conversation/RemoveMembers";
import { useClient } from "@/contexts/XMTPContext";
import { getMemberAddress } from "@/helpers/xmtp";
import type { ClientPermissions } from "@/hooks/useClientPermissions";

export type MembersProps = {
  addedMembers: PendingMember[];
  clientPermissions?: ClientPermissions;
  existingMembers: SafeGroupMember[];
  onMembersAdded?: AddMembersProps["onMembersAdded"];
  onMembersRemoved?: (members: SafeGroupMember[]) => void;
  removedMembers: SafeGroupMember[];
};

export const Members: React.FC<MembersProps> = ({
  addedMembers,
  clientPermissions,
  existingMembers,
  onMembersAdded,
  onMembersRemoved,
  removedMembers,
}) => {
  const client = useClient();
  const handleRemoveMember = useCallback(
    (inboxId: string) => {
      const member = existingMembers.find((m) => m.inboxId === inboxId);
      if (!member) {
        return;
      }
      onMembersRemoved?.([...removedMembers, member]);
    },
    [existingMembers, removedMembers, onMembersRemoved],
  );

  const showAddMembersSection =
    !existingMembers.length ||
    (clientPermissions && clientPermissions.canAddMembers);
  const showRemovedMembersSection =
    !existingMembers.length ||
    (clientPermissions && clientPermissions.canRemoveMembers);

  const finalMembers = useMemo(() => {
    return existingMembers.filter(
      (member) => !removedMembers.some((m) => m.inboxId === member.inboxId),
    );
  }, [existingMembers, removedMembers]);

  return (
    <Stack gap="md" p="md">
      {showAddMembersSection && (
        <AddMembers
          existingMembers={existingMembers}
          addedMembers={addedMembers}
          onMembersAdded={onMembersAdded}
        />
      )}
      {existingMembers.length > 0 && (
        <>
          <Stack gap="xs">
            <Group justify="space-between" gap="xs">
              <Title order={4}>Existing members</Title>
            </Group>
            {showRemovedMembersSection && (
              <>
                <Divider mb="md" />
                <RemoveMembers
                  removedMembers={removedMembers}
                  onMembersRemoved={onMembersRemoved}
                />
              </>
            )}
          </Stack>
          <Stack gap="xs">
            <Group gap="xs">
              <Text fw={700}>Members</Text>
              <Badge color="gray" size="lg">
                {finalMembers.length}
              </Badge>
            </Group>
            <Stack gap="0">
              {finalMembers.map((member) => (
                <Member
                  key={member.inboxId}
                  address={getMemberAddress(member)}
                  displayName=""
                  avatar={null}
                  description={null}
                  onClick={
                    showRemovedMembersSection &&
                    member.inboxId !== client.inboxId
                      ? () => {
                          handleRemoveMember(member.inboxId);
                        }
                      : undefined
                  }
                />
              ))}
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
};
