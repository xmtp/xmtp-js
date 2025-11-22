import { Badge, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { Member } from "@/components/Conversation/Member";
import type { Member as MemberCardMember } from "@/components/Conversation/MemberCard";
import { useMemberId } from "@/hooks/useMemberId";
import type { MemberProfile } from "@/hooks/useMemberProfiles";

const hasInboxId = (
  members: MemberProfile[] | PendingMember[],
  inboxId: string,
) => {
  return members.some((member) => member.inboxId === inboxId);
};

export type PendingMember = MemberCardMember & {
  inboxId: string;
};

export type AddMembersProps = {
  existingMembers: MemberProfile[];
  addedMembers: PendingMember[];
  onMembersAdded?: (members: PendingMember[]) => void;
};

export const AddMembers: React.FC<AddMembersProps> = ({
  existingMembers,
  addedMembers,
  onMembersAdded,
}) => {
  const {
    loading,
    memberId,
    setMemberId,
    displayName: memberIdDisplayName,
    error: memberIdError,
    inboxId: memberIdInboxId,
    address: memberIdAddress,
    description: memberIdDescription,
    avatar: memberIdAvatar,
  } = useMemberId();
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = useCallback(() => {
    if (hasInboxId(addedMembers, memberIdInboxId)) return;
    const member = {
      inboxId: memberIdInboxId,
      address: memberIdAddress,
      displayName: memberIdDisplayName,
      avatar: memberIdAvatar,
      description: memberIdDescription,
    };
    setMemberId("");
    onMembersAdded?.([...addedMembers, member]);
  }, [
    addedMembers,
    memberIdInboxId,
    memberIdAddress,
    memberIdDisplayName,
    memberIdDescription,
    memberIdAvatar,
    onMembersAdded,
  ]);

  const handleRemoveAddedMember = useCallback(
    (inboxId: string) => {
      const newAddedMembers = addedMembers.filter((m) => m.inboxId !== inboxId);
      onMembersAdded?.(newAddedMembers);
    },
    [addedMembers, onMembersAdded],
  );

  useEffect(() => {
    if (
      memberIdInboxId &&
      (hasInboxId(existingMembers, memberIdInboxId) ||
        hasInboxId(addedMembers, memberIdInboxId))
    ) {
      setError("Duplicate address or inbox ID");
    } else {
      setError(null);
    }
  }, [existingMembers, memberIdInboxId, addedMembers]);

  return (
    <>
      <Group gap="xs" align="flex-start">
        <TextInput
          flex={1}
          size="sm"
          label="Address, inbox ID, ENS name, or Base name"
          styles={{
            label: {
              marginBottom: "var(--mantine-spacing-xxs)",
            },
          }}
          error={memberIdError || error}
          value={memberId}
          onChange={(event) => {
            setMemberId(event.target.value);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              memberIdError === null &&
              error === null &&
              !loading &&
              memberIdInboxId
            ) {
              handleAddMember();
            }
          }}
        />
        <Button
          size="sm"
          mt="32px"
          disabled={
            memberIdError !== null ||
            loading ||
            !memberIdInboxId ||
            error !== null
          }
          loading={loading}
          onClick={handleAddMember}>
          Add
        </Button>
      </Group>
      <Stack gap="xs">
        <Group gap="xs" justify="space-between" align="center">
          <Text fw={700}>Added members</Text>
          <Badge color="gray" size="lg">
            {addedMembers.length}
          </Badge>
        </Group>
        {addedMembers.length > 0 && (
          <Stack gap="4px">
            {addedMembers.map((member) => (
              <Member
                key={member.inboxId}
                displayName={member.displayName}
                address={member.address}
                avatar={member.avatar}
                description={member.description}
                onClick={() => {
                  handleRemoveAddedMember(member.inboxId);
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </>
  );
};
