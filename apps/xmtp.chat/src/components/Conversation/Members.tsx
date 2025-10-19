import { Badge, Group, Stack, Text } from "@mantine/core";
import { useCallback, useMemo } from "react";
import {
  AddMembers,
  type AddMembersProps,
  type PendingMember,
} from "@/components/Conversation/AddMembers";
import { Member } from "@/components/Conversation/Member";
import { RemoveMembers } from "@/components/Conversation/RemoveMembers";
import { useClient } from "@/contexts/XMTPContext";
import type { ClientPermissions } from "@/hooks/useClientPermissions";
import { type MemberProfile } from "@/hooks/useMemberProfiles";

export type MembersProps = {
  addedMembers: PendingMember[];
  clientPermissions?: ClientPermissions;
  existingMembers: MemberProfile[];
  onMembersAdded?: AddMembersProps["onMembersAdded"];
  onMembersRemoved?: (members: MemberProfile[]) => void;
  removedMembers: MemberProfile[];
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

  const superAdmins = useMemo(() => {
    return finalMembers.filter(
      // @ts-expect-error - the types are wrong
      (member) => member.permissionLevel === "SuperAdmin",
    );
  }, [finalMembers]);

  const admins = useMemo(() => {
    return finalMembers.filter(
      // @ts-expect-error - the types are wrong
      (member) => member.permissionLevel === "Admin",
    );
  }, [finalMembers]);

  const members = useMemo(() => {
    return finalMembers.filter(
      // @ts-expect-error - the types are wrong
      (member) => member.permissionLevel === "Member",
    );
  }, [finalMembers]);

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
          {showRemovedMembersSection && (
            <RemoveMembers
              removedMembers={removedMembers}
              onMembersRemoved={onMembersRemoved}
            />
          )}
          <Stack gap="xs">
            <Group gap="xs" justify="space-between" align="center">
              <Text fw={700}>Members</Text>
              <Badge color="gray" size="lg">
                {finalMembers.length}
              </Badge>
            </Group>
            {superAdmins.length > 0 && (
              <>
                <Group gap="xs">
                  <Text size="sm" fw={700}>
                    Super admins
                  </Text>
                  <Badge color="gray" size="md">
                    {superAdmins.length}
                  </Badge>
                </Group>
                <Stack gap="0">
                  {superAdmins.map((member) => (
                    <Member
                      key={member.inboxId}
                      address={member.address}
                      displayName={member.displayName}
                      avatar={member.avatar}
                      description={member.description}
                    />
                  ))}
                </Stack>
              </>
            )}
            {admins.length > 0 && (
              <>
                <Group gap="xs">
                  <Text size="sm" fw={700}>
                    Admins
                  </Text>
                  <Badge color="gray" size="md">
                    {admins.length}
                  </Badge>
                </Group>
                <Stack gap="0">
                  {admins.map((member) => (
                    <Member
                      key={member.inboxId}
                      address={member.address}
                      displayName={member.displayName}
                      avatar={member.avatar}
                      description={member.description}
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
              </>
            )}
            {members.length > 0 && (
              <>
                <Group gap="xs">
                  <Text size="sm" fw={700}>
                    Members
                  </Text>
                  <Badge color="gray" size="md">
                    {members.length}
                  </Badge>
                </Group>
                <Stack gap="0">
                  {members.map((member) => (
                    <Member
                      key={member.inboxId}
                      address={member.address}
                      displayName={member.displayName}
                      avatar={member.avatar}
                      description={member.description}
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
              </>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
};
