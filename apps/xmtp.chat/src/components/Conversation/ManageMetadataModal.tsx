import { Button, Group } from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { Metadata } from "@/components/Conversation/Metadata";
import { Modal } from "@/components/Modal";
import { useClientPermissions } from "@/hooks/useClientPermissions";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { useConversation } from "@/hooks/useConversation";
import { ContentLayout } from "@/layouts/ContentLayout";
import { useActions } from "@/stores/inbox/hooks";

export const ManageMetadataModal: React.FC = () => {
  const { conversationId } = useOutletContext<ConversationOutletContext>();
  const { conversation } = useConversation(conversationId);
  const clientPermissions = useClientPermissions(conversationId);
  const { addConversation } = useActions();
  const navigate = useNavigate();
  const fullScreen = useCollapsedMediaQuery();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const contentHeight = fullScreen ? "auto" : 500;
  const initialName = useRef("");
  const initialDescription = useRef("");
  const initialImageUrl = useRef("");

  const handleClose = useCallback(() => {
    void navigate(`/conversations/${conversation.id}`);
  }, [navigate, conversation.id]);

  const handleUpdate = useCallback(async () => {
    if (conversation instanceof XmtpGroup) {
      setIsLoading(true);
      try {
        let hasUpdated = false;
        if (name !== initialName.current) {
          await conversation.updateName(name);
          hasUpdated = true;
        }
        if (description !== initialDescription.current) {
          await conversation.updateDescription(description);
          hasUpdated = true;
        }
        if (imageUrl !== initialImageUrl.current) {
          await conversation.updateImageUrl(imageUrl);
          hasUpdated = true;
        }

        if (hasUpdated) {
          void addConversation(conversation);
        }

        void navigate(`/conversations/${conversation.id}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [conversation, name, description, imageUrl, navigate]);

  useEffect(() => {
    if (conversation instanceof XmtpGroup) {
      initialName.current = conversation.name ?? "";
      initialDescription.current = conversation.description ?? "";
      initialImageUrl.current = conversation.imageUrl ?? "";
    }
  }, [conversation]);

  const footer = useMemo(() => {
    return (
      <Group justify="flex-end" flex={1} p="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          disabled={
            name === initialName.current &&
            description === initialDescription.current &&
            imageUrl === initialImageUrl.current
          }
          loading={isLoading}
          onClick={() => void handleUpdate()}>
          Save
        </Button>
      </Group>
    );
  }, [isLoading, handleUpdate, handleClose]);

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      opened
      centered
      fullScreen={fullScreen}
      onClose={handleClose}
      size="md"
      padding={0}>
      <ContentLayout
        title="Manage metadata"
        maxHeight={contentHeight}
        footer={footer}
        withScrollFade={false}
        withScrollAreaPadding={false}>
        <Metadata
          conversation={conversation}
          clientPermissions={clientPermissions}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onImageUrlChange={setImageUrl}
        />
      </ContentLayout>
    </Modal>
  );
};
