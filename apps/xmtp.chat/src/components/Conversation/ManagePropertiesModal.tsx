import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { Group as XmtpGroup } from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { ContentLayout } from "@/layouts/ContentLayout";

export const ManagePropertiesModal: React.FC = () => {
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
  }, [conversation.id, name, description, imageUrl]);

  useEffect(() => {
    if (conversation instanceof XmtpGroup) {
      initialName.current = conversation.name ?? "";
      initialDescription.current = conversation.description ?? "";
      initialImageUrl.current = conversation.imageUrl ?? "";
      setName(conversation.name ?? "");
      setDescription(conversation.description ?? "");
      setImageUrl(conversation.imageUrl ?? "");
    } else {
      handleClose();
    }
  }, [conversation.id]);

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
      size="md"
      padding={0}>
      <ContentLayout
        title="Manage properties"
        maxHeight={contentHeight}
        footer={footer}
        withScrollFade={false}
        withScrollAreaPadding={false}>
        <Stack gap="xs" p="md">
          <Group gap="sm" align="center" wrap="nowrap">
            <Text flex="1 1 20%" size="sm">
              Name
            </Text>
            <TextInput
              size="sm"
              flex="1 1 60%"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </Group>
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <Text flex="1 1 20%" size="sm">
              Description
            </Text>
            <Textarea
              size="sm"
              flex="1 1 60%"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
            />
          </Group>
          <Group gap="sm" align="center" wrap="nowrap">
            <Text flex="1 1 20%" size="sm">
              Image URL
            </Text>
            <TextInput
              size="sm"
              flex="1 1 60%"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
              }}
            />
          </Group>
        </Stack>
      </ContentLayout>
    </Modal>
  );
};
