import { Badge, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import {
  Group as XmtpGroup,
  type Conversation,
  type SafeGroupMember,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { BadgeWithCopy } from "../BadgeWithCopy";

export type MembersProps = {
  conversation?: Conversation;
  inboxId: string;
  onMembersAdded: (members: string[]) => void;
  onMembersRemoved?: (members: SafeGroupMember[]) => void;
};

export const Members: React.FC<MembersProps> = ({
  conversation,
  inboxId,
  onMembersAdded,
  onMembersRemoved,
}) => {
  const [memberId, setMemberId] = useState("");
  const [memberIdError, setMemberIdError] = useState<string | null>(null);
  const [members, setMembers] = useState<SafeGroupMember[]>([]);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [removedMembers, setRemovedMembers] = useState<SafeGroupMember[]>([]);

  const handleAddMember = useCallback(() => {
    const newAddedMembers = [...addedMembers, memberId.toLowerCase()];
    setAddedMembers(newAddedMembers);
    setMemberId("");
    setMemberIdError(null);
    onMembersAdded(newAddedMembers);
  }, [addedMembers, memberId]);

  const handleRemoveAddedMember = useCallback(
    (member: string) => {
      const newAddedMembers = addedMembers.filter((m) => m !== member);
      setAddedMembers(newAddedMembers);
      onMembersAdded(newAddedMembers);
    },
    [addedMembers],
  );

  const handleRemoveMember = useCallback(
    (member: SafeGroupMember) => {
      setMembers(members.filter((m) => m.inboxId !== member.inboxId));
      const newRemovedMembers = [...removedMembers, member];
      setRemovedMembers(newRemovedMembers);
      onMembersRemoved?.(newRemovedMembers);
    },
    [members, removedMembers],
  );

  const handleRestoreRemovedMember = useCallback(
    (member: SafeGroupMember) => {
      const newRemovedMembers = removedMembers.filter(
        (m) => m.inboxId !== member.inboxId,
      );
      setRemovedMembers(newRemovedMembers);
      onMembersRemoved?.(newRemovedMembers);
      setMembers([...members, member]);
    },
    [members, removedMembers],
  );

  const memberIds = useMemo(() => {
    return members.reduce<string[]>((ids, member) => {
      return [
        ...ids,
        ...member.accountIdentifiers.map((identifier) =>
          identifier.identifier.toLowerCase(),
        ),
        member.inboxId,
      ];
    }, []);
  }, [members]);

  useEffect(() => {
    if (!memberId) {
      setMemberIdError(null);
      return;
    }

    if (memberIds.includes(memberId.toLowerCase())) {
      setMemberIdError("Duplicate address or inbox ID");
    } else if (!isValidEthereumAddress(memberId) && !isValidInboxId(memberId)) {
      setMemberIdError("Invalid address or inbox ID");
    } else {
      setMemberIdError(null);
    }
  }, [memberIds, memberId]);

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

  return (
    <Stack gap="md" p="md">
      <Group gap="xs" align="flex-start">
        <Stack flex={1} gap="xs">
          <TextInput
            size="sm"
            label="Address or inbox ID"
            error={memberIdError}
            value={memberId}
            onChange={(event) => {
              setMemberId(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && memberIdError === null) {
                handleAddMember();
              }
            }}
          />
        </Stack>
        <Button
          size="sm"
          mt="1.5rem"
          disabled={memberIdError !== null}
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
            <Group
              key={member}
              justify="space-between"
              align="center"
              wrap="nowrap">
              <BadgeWithCopy value={member} />
              <Button
                flex="0 0 auto"
                size="xs"
                onClick={() => {
                  handleRemoveAddedMember(member);
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
            <Group gap="xs">
              <Text fw={700}>Removed members</Text>
              <Badge color="gray" size="lg">
                {removedMembers.length}
              </Badge>
            </Group>
            <Stack gap="4px">
              {removedMembers.map((member) => (
                <Group
                  key={member.inboxId}
                  justify="space-between"
                  align="center"
                  wrap="nowrap">
                  <BadgeWithCopy value={member.inboxId} />
                  <Button
                    flex="0 0 auto"
                    size="xs"
                    onClick={() => {
                      handleRestoreRemovedMember(member);
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
                (member) =>
                  inboxId !== member.inboxId && (
                    <Group
                      key={member.inboxId}
                      justify="space-between"
                      align="center"
                      wrap="nowrap">
                      <BadgeWithCopy value={member.inboxId} />
                      <Button
                        flex="0 0 auto"
                        size="xs"
                        onClick={() => {
                          handleRemoveMember(member);
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
