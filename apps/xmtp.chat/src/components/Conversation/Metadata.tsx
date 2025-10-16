import { Group, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { Group as XmtpGroup, type Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";
import { type ClientPermissions } from "@/hooks/useClientPermissions";

type MetadataProps = {
  conversation?: Conversation;
  clientPermissions?: ClientPermissions;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onImageUrlChange: (imageUrl: string) => void;
};

export const Metadata: React.FC<MetadataProps> = ({
  conversation,
  clientPermissions,
  onNameChange,
  onDescriptionChange,
  onImageUrlChange,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (conversation instanceof XmtpGroup) {
      setName(conversation.name ?? "");
      setDescription(conversation.description ?? "");
      setImageUrl(conversation.imageUrl ?? "");
    }
  }, [conversation?.id]);

  useEffect(() => {
    onNameChange(name);
  }, [name, onNameChange]);

  useEffect(() => {
    onDescriptionChange(description);
  }, [description, onDescriptionChange]);

  useEffect(() => {
    onImageUrlChange(imageUrl);
  }, [imageUrl, onImageUrlChange]);

  return (
    <Stack gap="xs" p="md">
      <Group gap="sm" align="center" wrap="nowrap">
        <Text flex="1 1 20%" size="sm">
          Name
        </Text>
        <TextInput
          size="sm"
          flex="1 1 65%"
          value={name}
          disabled={
            conversation &&
            clientPermissions &&
            !clientPermissions.canChangeGroupName
          }
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
          flex="1 1 65%"
          value={description}
          disabled={
            conversation &&
            clientPermissions &&
            !clientPermissions.canChangeGroupDescription
          }
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
          flex="1 1 65%"
          value={imageUrl}
          disabled={
            conversation &&
            clientPermissions &&
            !clientPermissions.canChangeGroupImage
          }
          onChange={(event) => {
            setImageUrl(event.target.value);
          }}
        />
      </Group>
    </Stack>
  );
};
