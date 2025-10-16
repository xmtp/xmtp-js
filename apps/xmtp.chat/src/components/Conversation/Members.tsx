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
import {
  Group as XmtpGroup,
  type Conversation,
  type SafeGroupMember,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useState } from "react";
import { IdentityBadge } from "@/components/IdentityBadge";
import { useClient } from "@/contexts/XMTPContext";
import { getMemberAddress } from "@/helpers/xmtp";
import type { ClientPermissions } from "@/hooks/useClientPermissions";
import { useMemberId } from "@/hooks/useMemberId";
import classes from "./Members.module.css";

export type PendingMember = {
  inboxId: string;
  address: string;
  displayName?: string;
};

export type MembersProps = {
  conversation?: Conversation;
  clientPermissions?: ClientPermissions;
  onMembersAdded: (members: PendingMember[]) => void;
  onMembersRemoved?: (members: SafeGroupMember[]) => void;
};

const hasInboxId = (
  members: SafeGroupMember[] | PendingMember[],
  inboxId: string,
) => {
  return members.some((member) => member.inboxId === inboxId);
};

type MemberProps = {
  inboxId: string;
  address: string;
  displayName?: string;
  disableRemove?: boolean;
  onClick: () => void;
  buttonLabel: string;
};

const Member: React.FC<MemberProps> = ({
  inboxId,
  address,
  displayName,
  disableRemove = false,
  onClick,
  buttonLabel,
}) => {
  return (
    <Group
      justify="space-between"
      align="center"
      wrap="nowrap"
      p="xxxs"
      className={classes.member}>
      <IdentityBadge address={address} displayName={displayName ?? inboxId} />
      <Button
        disabled={disableRemove}
        flex="0 0 auto"
        size="xs"
        onClick={onClick}>
        {buttonLabel}
      </Button>
    </Group>
  );
};

export const Members: React.FC<MembersProps> = ({
  conversation,
  clientPermissions,
  onMembersAdded,
  onMembersRemoved,
}) => {
  const client = useClient();
  const {
    loading,
    memberId,
    setMemberId,
    displayName: memberIdDisplayName,
    error: memberIdError,
    inboxId: memberIdInboxId,
    address: memberIdAddress,
  } = useMemberId();
  const [otherMemberError, setOtherMemberError] = useState<string | null>(null);
  const [members, setMembers] = useState<SafeGroupMember[]>([]);
  const [addedMembers, setAddedMembers] = useState<PendingMember[]>([]);
  const [removedMembers, setRemovedMembers] = useState<SafeGroupMember[]>([]);

  const handleAddMember = useCallback(() => {
    if (hasInboxId(addedMembers, memberIdInboxId)) return;
    const member = {
      inboxId: memberIdInboxId,
      address: memberIdAddress,
      displayName: memberIdDisplayName,
    };
    const newAddedMembers = [...addedMembers, member];
    setAddedMembers(newAddedMembers);
    setMemberId("");
    onMembersAdded(newAddedMembers);
  }, [addedMembers, memberId, memberIdInboxId]);

  const handleRemoveAddedMember = useCallback(
    (inboxId: string) => {
      const newAddedMembers = addedMembers.filter((m) => m.inboxId !== inboxId);
      setAddedMembers(newAddedMembers);
      onMembersAdded(newAddedMembers);
    },
    [addedMembers],
  );

  const handleRemoveMember = useCallback(
    (inboxId: string) => {
      const member = members.find((m) => m.inboxId === inboxId);
      if (!member) {
        return;
      }
      setMembers(members.filter((m) => m.inboxId !== inboxId));
      const newRemovedMembers = [...removedMembers, member];
      setRemovedMembers(newRemovedMembers);
      onMembersRemoved?.(newRemovedMembers);
    },
    [members, removedMembers],
  );

  const handleRestoreRemovedMember = useCallback(
    (inboxId: string) => {
      const member = removedMembers.find((m) => m.inboxId === inboxId);
      if (!member) {
        return;
      }
      const newRemovedMembers = removedMembers.filter(
        (m) => m.inboxId !== inboxId,
      );
      setRemovedMembers(newRemovedMembers);
      onMembersRemoved?.(newRemovedMembers);
      setMembers([...members, member]);
    },
    [members, removedMembers],
  );

  useEffect(() => {
    if (
      memberIdInboxId &&
      (hasInboxId(members, memberIdInboxId) ||
        hasInboxId(addedMembers, memberIdInboxId) ||
        hasInboxId(removedMembers, memberIdInboxId))
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
      setMembers(members);
    };

    void loadMembers();
  }, [conversation?.id]);

  const showAddMembersSection =
    !conversation || (clientPermissions && clientPermissions.canAddMembers);
  const showRemovedMembersSection =
    !conversation || (clientPermissions && clientPermissions.canRemoveMembers);

  return (
    <Stack gap="md" p="md">
      {showAddMembersSection && (
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
              {addedMembers.map((member) => (
                <Member
                  key={member.inboxId}
                  buttonLabel="Remove"
                  displayName={member.displayName}
                  inboxId={member.inboxId}
                  address={member.address}
                  onClick={() => {
                    handleRemoveAddedMember(member.inboxId);
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </>
      )}
      {conversation && (
        <>
          <Stack gap="xs">
            <Group justify="space-between" gap="xs">
              <Title order={4}>Existing members</Title>
            </Group>
            {showRemovedMembersSection && (
              <>
                <Divider mb="md" />
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
                      inboxId={member.inboxId}
                      address={getMemberAddress(member)}
                      onClick={() => {
                        handleRestoreRemovedMember(member.inboxId);
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Stack>
          <Stack gap="xs">
            <Group gap="xs">
              <Text fw={700}>Members</Text>
              <Badge color="gray" size="lg">
                {members.length}
              </Badge>
            </Group>
            <Stack gap="0">
              {members.map((member) => (
                <Member
                  key={member.inboxId}
                  buttonLabel="Remove"
                  inboxId={member.inboxId}
                  address={getMemberAddress(member)}
                  disableRemove={
                    member.inboxId === client.inboxId ||
                    !showRemovedMembersSection
                  }
                  onClick={() => {
                    handleRemoveMember(member.inboxId);
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
};
