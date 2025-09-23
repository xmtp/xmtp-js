import {
  Badge,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Group as XmtpGroup, type Conversation } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { useMemberId } from "@/hooks/useMemberId";
import { BadgeWithCopy } from "../BadgeWithCopy";

export type MembersProps = {
  conversation?: Conversation;
  inboxId: string;
  onMembersAdded: (members: string[]) => void;
  onMembersRemoved?: (members: string[]) => void;
};

export const Members: React.FC<MembersProps> = ({
  conversation,
  inboxId,
  onMembersAdded,
  onMembersRemoved,
}) => {
  const {
    loading,
    memberId,
    setMemberId,
    error: memberIdError,
    inboxId: memberIdInboxId,
  } = useMemberId();
  const [otherMemberError, setOtherMemberError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [removedMembers, setRemovedMembers] = useState<string[]>([]);

  const handleAddMember = useCallback(() => {
    const newAddedMembers = [...addedMembers, memberIdInboxId];
    setAddedMembers(newAddedMembers);
    setMemberId("");
    onMembersAdded(newAddedMembers);
  }, [addedMembers, memberId, memberIdInboxId]);

  const handleRemoveAddedMember = useCallback(
    (inboxId: string) => {
      const newAddedMembers = addedMembers.filter((v) => v !== inboxId);
      setAddedMembers(newAddedMembers);
      onMembersAdded(newAddedMembers);
    },
    [addedMembers],
  );

  const handleRemoveMember = useCallback(
    (inboxId: string) => {
      setMembers(members.filter((v) => v !== inboxId));
      const newRemovedMembers = [...removedMembers, inboxId];
      setRemovedMembers(newRemovedMembers);
      onMembersRemoved?.(newRemovedMembers);
    },
    [members, removedMembers],
  );

  const handleRestoreRemovedMember = useCallback(
    (inboxId: string) => {
      const newRemovedMembers = removedMembers.filter((v) => v !== inboxId);
      setRemovedMembers(newRemovedMembers);
      onMembersRemoved?.(newRemovedMembers);
      setMembers([...members, inboxId]);
    },
    [members, removedMembers],
  );

  useEffect(() => {
    if (
      memberIdInboxId &&
      (members.includes(memberIdInboxId) ||
        addedMembers.includes(memberIdInboxId) ||
        removedMembers.includes(memberIdInboxId))
    ) {
      setOtherMemberError("Duplicate address or inbox ID");
    } else {
      setOtherMemberError(null);
    }
  }, [members, memberIdInboxId, addedMembers, removedMembers]);

  useEffect(() => {
    if (!conversation || !(conversation instanceof XmtpGroup)) {
      return;
    }

    const loadMembers = async () => {
      const members = await conversation.members();
      setMembers(members.map((member) => member.inboxId));
    };

    void loadMembers();
  }, [conversation?.id]);

  return (
    <Stack gap="md" p="md">
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
          error={memberIdError || otherMemberError}
          value={memberId}
          onChange={(event) => {
            setMemberId(event.target.value);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              memberIdError === null &&
              otherMemberError === null &&
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
            otherMemberError !== null
          }
          loading={loading}
          onClick={handleAddMember}>
          Add
        </Button>
      </Group>
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={700}>Added members</Text>
          <Badge color="gray" size="lg">
            {addedMembers.length}
          </Badge>
        </Group>
        <Stack gap="4px">
          {addedMembers.map((inboxId) => (
            <Group
              key={inboxId}
              justify="space-between"
              align="center"
              wrap="nowrap">
              <BadgeWithCopy value={inboxId} />
              <Button
                flex="0 0 auto"
                size="xs"
                onClick={() => {
                  handleRemoveAddedMember(inboxId);
                }}>
                Remove
              </Button>
            </Group>
          ))}
        </Stack>
      </Stack>
      {conversation && (
        <>
          <Stack gap="xs">
            <Group justify="space-between" gap="xs">
              <Title order={4}>Existing members</Title>
            </Group>
            <Divider mb="md" />
            <Group gap="xs">
              <Text fw={700}>Removed members</Text>
              <Badge color="gray" size="lg">
                {removedMembers.length}
              </Badge>
            </Group>
            <Stack gap="4px">
              {removedMembers.map((inboxId) => (
                <Group
                  key={`${inboxId}-removed`}
                  justify="space-between"
                  align="center"
                  wrap="nowrap">
                  <BadgeWithCopy value={inboxId} />
                  <Button
                    flex="0 0 auto"
                    size="xs"
                    onClick={() => {
                      handleRestoreRemovedMember(inboxId);
                    }}>
                    Restore
                  </Button>
                </Group>
              ))}
            </Stack>
          </Stack>
          <Stack gap="xs">
            <Group gap="xs">
              <Text fw={700}>Members</Text>
              <Badge color="gray" size="lg">
                {members.length - 1}
              </Badge>
            </Group>
            <Stack gap="4px">
              {members.map(
                (mInboxId) =>
                  inboxId !== mInboxId && (
                    <Group
                      key={mInboxId}
                      justify="space-between"
                      align="center"
                      wrap="nowrap">
                      <BadgeWithCopy value={mInboxId} />
                      <Button
                        flex="0 0 auto"
                        size="xs"
                        onClick={() => {
                          handleRemoveMember(mInboxId);
                        }}>
                        Remove
                      </Button>
                    </Group>
                  ),
              )}
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
};
