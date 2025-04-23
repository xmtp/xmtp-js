import { Badge, Button, Group, Stack, Text, TextInput } from "@mantine/core";
import {
  Utils,
  Group as XmtpGroup,
  type Conversation,
  type SafeGroupMember,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { useSettings } from "@/hooks/useSettings";
import { BadgeWithCopy } from "../BadgeWithCopy";
import { AddressBadge } from "../AddressBadge";

export type MembersProps = {
  conversation?: Conversation;
  inboxId: string;
  onMembersAdded: (members: string[]) => void;
  onMembersRemoved?: (members: SafeGroupMember[]) => void;
};

type MemberDisplayProps = {
  member: string | SafeGroupMember;
  showAddresses?: boolean;
};

const MemberDisplay: React.FC<MemberDisplayProps> = ({ member, showAddresses = true }) => {
  if (typeof member === "string") {
    // For newly added members (string format)
    return (
      <Stack gap="xs">
        <BadgeWithCopy value={member} />
      </Stack>
    );
  }

  // For existing members (SafeGroupMember format)
  // Filter for Ethereum identifiers
  const ethAddresses = member.accountIdentifiers
    .filter((identifier: { identifierKind: string; identifier: string }) =>
      identifier.identifierKind === "Ethereum"
    )
    .map((identifier: { identifierKind: string; identifier: string }) =>
      identifier.identifier
    );

  return (
    <Stack gap="xs">
      <BadgeWithCopy value={member.inboxId} />
      {showAddresses && ethAddresses.length > 0 && (
        <Group gap="xs" ml="md">
          {ethAddresses.map((address: string) => (
            <AddressBadge key={address} address={address} />
          ))}
        </Group>
      )}
    </Stack>
  );
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
  const { environment } = useSettings();
  const utilsRef = useRef<Utils | null>(null);

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
    return members.reduce<string[]>((ids: string[], member: SafeGroupMember) => {
      return [
        ...ids,
        ...member.accountIdentifiers.map((identifier: { identifierKind: string; identifier: string }) =>
          identifier.identifier.toLowerCase(),
        ),
        member.inboxId,
      ];
    }, []);
  }, [members]);

  useEffect(() => {
    const utils = new Utils();
    utilsRef.current = utils;
    return () => {
      utils.close();
    };
  }, []);

  useEffect(() => {
    const checkMemberId = async () => {
      if (!memberId) {
        setMemberIdError(null);
        return;
      }

      if (memberIds.includes(memberId.toLowerCase())) {
        setMemberIdError("Duplicate address or inbox ID");
      } else if (
        !isValidEthereumAddress(memberId) &&
        !isValidInboxId(memberId)
      ) {
        setMemberIdError("Invalid address or inbox ID");
      } else if (isValidEthereumAddress(memberId) && utilsRef.current) {
        const inboxId = await utilsRef.current.getInboxIdForIdentifier(
          {
            identifier: memberId.toLowerCase(),
            identifierKind: "Ethereum",
          },
          environment,
        );
        if (!inboxId) {
          setMemberIdError("Address not registered on XMTP");
        } else {
          setMemberIdError(null);
        }
      } else {
        setMemberIdError(null);
      }
    };

    void checkMemberId();
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
        <TextInput
          flex={1}
          size="sm"
          label="Address or inbox ID"
          styles={{
            label: {
              marginBottom: "var(--mantine-spacing-xxs)",
            },
          }}
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
        <Button
          size="sm"
          mt="32px"
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
              <MemberDisplay member={member} showAddresses={false} />
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
                  <MemberDisplay member={member} />
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
                      <MemberDisplay member={member} />
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
