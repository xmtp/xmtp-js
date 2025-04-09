import { Button, Group } from "@mantine/core";
import { Group as XmtpGroup, type SafeGroupMember } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { Members } from "@/components/Conversation/Members";
import { Modal } from "@/components/Modal";
import { isValidEthereumAddress, isValidInboxId } from "@/helpers/strings";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ManageMembersModal: React.FC = () => {
  const { conversation, client } =
    useOutletContext<ConversationOutletContext>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
        const addedMemberInboxIds = addedMembers.filter((member) =>
          isValidInboxId(member),
        );
        if (addedMemberInboxIds.length > 0) {
          await conversation.addMembers(addedMemberInboxIds);
        }
        const addedMemberAddresses = addedMembers.filter((member) =>
          isValidEthereumAddress(member),
        );
        if (addedMemberAddresses.length > 0) {
          await conversation.addMembersByIdentifiers(
            addedMemberAddresses.map((address) => ({
              identifier: address.toLowerCase(),
              identifierKind: "Ethereum",
            })),
          );
        }
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
          conversation={conversation}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          inboxId={client.inboxId!}
          onMembersAdded={setAddedMembers}
          onMembersRemoved={setRemovedMembers}
        />
      </ContentLayout>
    </Modal>
  );
};
