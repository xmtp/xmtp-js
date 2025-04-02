import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Group as XmtpGroup, type SafeGroupMember } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { isValidLongWalletAddress } from "@/helpers/address";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { ContentLayout } from "@/layouts/ContentLayout";
import { BadgeWithCopy } from "../BadgeWithCopy";

export const ManageMembersModal: React.FC = () => {
  const { conversation, client } =
    useOutletContext<ConversationOutletContext>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [members, setMembers] = useState<SafeGroupMember[]>([]);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [removedMembers, setRemovedMembers] = useState<SafeGroupMember[]>([]);

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

  const handleClose = useCallback(() => {
    void navigate(`/conversations/${conversation.id}`);
  }, [navigate, conversation.id]);

  const handleUpdate = useCallback(async () => {
    if (!(conversation instanceof XmtpGroup)) {
      return;
    }

    setIsLoading(true);
    try {
      if (addedMembers.length > 0) {
        await conversation.addMembersByIdentifiers(
          addedMembers.map((member) => ({
            identifier: member.toLowerCase(),
            identifierKind: "Ethereum",
          })),
        );
      }
      if (removedMembers.length > 0) {
        await conversation.removeMembers(
          removedMembers.map((member) => member.inboxId),
        );
      }

      void navigate(`/conversations/${conversation.id}`);
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id, addedMembers, removedMembers, navigate]);

  const handleAddMember = useCallback(() => {
    setAddedMembers([...addedMembers, address.toLowerCase()]);
    setAddress("");
    setAddressError(null);
  }, [addedMembers, address]);

  const footer = useMemo(() => {
    return (
      <Group justify="flex-end" flex={1} p="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          disabled={isLoading}
          loading={isLoading}
          onClick={() => void handleUpdate()}>
          Save
        </Button>
      </Group>
    );
  }, [isLoading, handleUpdate]);

  useEffect(() => {
    if (
      members.some((member) =>
        member.accountIdentifiers.some(
          (identifier) =>
            identifier.identifier.toLowerCase() === address.toLowerCase(),
        ),
      )
    ) {
      setAddressError("Duplicate address");
    } else if (address && !isValidLongWalletAddress(address)) {
      setAddressError("Invalid address");
    } else {
      setAddressError(null);
    }
  }, [members, address]);

  useEffect(() => {
    if (!(conversation instanceof XmtpGroup)) {
      return;
    }
    const loadMembers = async () => {
      const members = await conversation.members();
      setMembers(members);
    };
    void loadMembers();
  }, [conversation.id]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="auto"
      padding={0}>
      <ContentLayout
        title="Manage members"
        maxHeight={contentHeight}
        footer={footer}
        withScrollAreaPadding={false}>
        <Stack gap="md" p="md">
          <Group gap="xs" align="flex-start">
            <Stack flex={1} gap="xs">
              <TextInput
                size="sm"
                label="Address"
                error={addressError}
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddMember();
                  }
                }}
              />
            </Stack>
            <Button
              size="sm"
              mt="1.5rem"
              disabled={addressError !== null}
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
                <Group key={member} justify="space-between" align="center">
                  <Text truncate="end" flex={1}>
                    {member}
                  </Text>
                  <Button
                    onClick={() => {
                      setAddedMembers(addedMembers.filter((m) => m !== member));
                    }}>
                    Remove
                  </Button>
                </Group>
              ))}
            </Stack>
          </Stack>
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
                  align="center">
                  <Text truncate="end" flex={1}>
                    <BadgeWithCopy value={member.inboxId} />
                  </Text>
                  <Button
                    size="xs"
                    onClick={() => {
                      setRemovedMembers(
                        removedMembers.filter(
                          (m) => m.inboxId !== member.inboxId,
                        ),
                      );
                      setMembers([...members, member]);
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
                  client.inboxId !== member.inboxId && (
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
                          setMembers(
                            members.filter((m) => m.inboxId !== member.inboxId),
                          );
                          setRemovedMembers([...removedMembers, member]);
                        }}>
                        Remove
                      </Button>
                    </Group>
                  ),
              )}
            </Stack>
          </Stack>
        </Stack>
      </ContentLayout>
    </Modal>
  );
};
