import { Button, Group } from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { PendingMember } from "@/components/Conversation/AddMembers";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { Members } from "@/components/Conversation/Members";
import { Modal } from "@/components/Modal";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversation } from "@/hooks/useConversation";
import {
  useMemberProfiles,
  type MemberProfile,
} from "@/hooks/useMemberProfiles";
import { ContentLayout } from "@/layouts/ContentLayout";
import { useActions } from "@/stores/inbox/hooks";

export const ManageMembersModal: React.FC = () => {
  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const { conversation, members } = useConversation(conversationId);
  const existingMembers = useMemberProfiles(Array.from(members.values()));
  const clientPermissions = useClientPermissions(conversationId);
  const { addConversation } = useActions();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [addedMembers, setAddedMembers] = useState<PendingMember[]>([]);
  const [removedMembers, setRemovedMembers] = useState<MemberProfile[]>([]);

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
      let hasUpdated = false;
      if (addedMembers.length > 0) {
        const addedMemberInboxIds = addedMembers
          .filter((member) => isValidInboxId(member.inboxId))
          .map((member) => member.inboxId);
        if (addedMemberInboxIds.length > 0) {
          await conversation.addMembers(addedMemberInboxIds);
          hasUpdated = true;
        }
        const addedMemberAddresses = addedMembers.filter((member) =>
          isValidEthereumAddress(member.address),
        );
        if (addedMemberAddresses.length > 0) {
          await conversation.addMembersByIdentifiers(
            addedMemberAddresses.map((member) => ({
              identifier: member.address.toLowerCase(),
              identifierKind: "Ethereum",
            })),
          );
          hasUpdated = true;
        }
      }

      if (removedMembers.length > 0) {
        await conversation.removeMembers(
          removedMembers.map((member) => member.inboxId),
        );
        hasUpdated = true;
      }

      if (hasUpdated) {
        void addConversation(conversation);
      }

      void navigate(`/conversations/${conversation.id}`);
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id, addedMembers, removedMembers, navigate]);

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

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="600"
      padding={0}>
      <ContentLayout
        title="Manage members"
        maxHeight={contentHeight}
        footer={footer}
        loading={isLoading}
        withScrollAreaPadding={false}>
        <Members
          addedMembers={addedMembers}
          clientPermissions={clientPermissions}
          existingMembers={existingMembers}
          removedMembers={removedMembers}
          onMembersAdded={setAddedMembers}
          onMembersRemoved={setRemovedMembers}
        />
      </ContentLayout>
    </Modal>
  );
};
