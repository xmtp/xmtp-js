import { Button, Group, Modal } from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { Metadata } from "@/components/Conversation/Metadata";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ManageMetadataModal: React.FC = () => {
  const { conversation } = useOutletContext<ConversationOutletContext>();
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
        if (name !== initialName.current) {
          await conversation.updateName(name);
        }
        if (description !== initialDescription.current) {
          await conversation.updateDescription(description);
        }
        if (imageUrl !== initialImageUrl.current) {
          await conversation.updateImageUrl(imageUrl);
        }

        void navigate(`/conversations/${conversation.id}`);
      } finally {
        setIsLoading(false);
      }
    }
  }, [conversation.id, name, description, imageUrl, navigate]);

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
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onImageUrlChange={setImageUrl}
        />
      </ContentLayout>
    </Modal>
  );
};
