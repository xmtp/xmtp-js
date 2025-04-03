import { Group, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { Group as XmtpGroup, type Conversation } from "@xmtp/browser-sdk";
import { useEffect, useState } from "react";

type MetadataProps = {
  conversation?: Conversation;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onImageUrlChange: (imageUrl: string) => void;
};

export const Metadata: React.FC<MetadataProps> = ({
  conversation,
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
          onChange={(event) => {
            setImageUrl(event.target.value);
          }}
        />
      </Group>
    </Stack>
  );
};
