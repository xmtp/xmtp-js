import {
  Badge,
  Button,
  FocusTrap,
  Group,
  LoadingOverlay,
  Modal,
  NativeSelect,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router";
import { isValidLongWalletAddress } from "../helpers/address";
import { useBodyClass } from "../hooks/useBodyClass";
import { useClient } from "../hooks/useClient";

type ConversationPermissions = "All members" | "Admin only" | "Custom policy";

export const NewConversation: React.FC = () => {
  useBodyClass("main-flex-layout");
  const { client } = useClient();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [invalidAddress, setInvalidAddress] = useState(false);
  const [isDmGroup, setIsDmGroup] = useState(false);
  const [permissions, setPermissions] =
    useState<ConversationPermissions>("All members");
  const [createConversationError, setCreateConversationError] = useState<
    string | null
  >(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pinnedFrameUrl, setPinnedFrameUrl] = useState("");

  const handleCreate = async () => {
    if (isDmGroup && members.length === 0) {
      setCreateConversationError(
        "Direct message groups must have at least one member",
      );
      return;
    }
    if (!client) {
      setCreateConversationError("Client not initialized");
      return;
    }
    setIsLoading(true);
    try {
      const conversation = isDmGroup
        ? await client.conversations.newDm(members[0])
        : await client.conversations.newGroup(members, {});
      void navigate(`/conversations/${conversation.id}`);
    } catch (error) {
      setCreateConversationError(
        `Failed to create conversation: ${error as Error}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = () => {
    if (!isValidLongWalletAddress(address)) {
      setInvalidAddress(true);
      return;
    }
    setMembers([...members, address]);
    setAddress("");
    setInvalidAddress(false);
  };

  return (
    <>
      {createConversationError && (
        <Modal
          opened={!!createConversationError}
          onClose={() => {
            setCreateConversationError(null);
          }}
          withCloseButton={false}
          centered>
          <Stack gap="md">
            <Title order={4}>Error</Title>
            <Text>{createConversationError}</Text>
            <Group justify="flex-end">
              <Button
                onClick={() => {
                  setCreateConversationError(null);
                }}>
                OK
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
      <FocusTrap>
        <Stack
          gap="lg"
          p="md"
          pos="relative"
          flex={1}
          style={{
            overflow: "hidden",
            margin: "calc(var(--mantine-spacing-md) * -1)",
          }}>
          <LoadingOverlay visible={isLoading} />
          <Title order={3}>New conversation</Title>
          <ScrollArea type="scroll" flex={1}>
            <Stack gap="lg">
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="md" justify="space-between">
                    <Title order={4}>Properties</Title>
                    <Switch
                      disabled={members.length > 1}
                      label="Direct message group"
                      size="md"
                      checked={isDmGroup}
                      onChange={(event) => {
                        setIsDmGroup(event.currentTarget.checked);
                      }}
                      labelPosition="left"
                    />
                  </Group>
                  <TextInput
                    label="Name"
                    disabled={isDmGroup}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                    }}
                  />
                  <TextInput
                    label="Description"
                    disabled={isDmGroup}
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                  />
                  <TextInput
                    label="Image URL"
                    disabled={isDmGroup}
                    value={imageUrl}
                    onChange={(event) => {
                      setImageUrl(event.target.value);
                    }}
                  />
                  <TextInput
                    label="Pinned frame URL"
                    disabled={isDmGroup}
                    value={pinnedFrameUrl}
                    onChange={(event) => {
                      setPinnedFrameUrl(event.target.value);
                    }}
                  />
                  <NativeSelect
                    flex={1}
                    disabled={isDmGroup}
                    label="Permissions"
                    value={permissions}
                    onChange={(event) => {
                      setPermissions(
                        event.currentTarget.value as ConversationPermissions,
                      );
                    }}
                    data={["All members", "Admin only", "Custom policy"]}
                  />
                </Stack>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Members</Title>
                  <Group gap="xs" align="flex-end">
                    <TextInput
                      label="Address"
                      flex={1}
                      error={invalidAddress}
                      value={address}
                      onBlur={() => {
                        if (isValidLongWalletAddress(address)) {
                          setInvalidAddress(false);
                        }
                      }}
                      onChange={(event) => {
                        setAddress(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleAddMember();
                        }
                      }}
                    />
                    <Button
                      disabled={
                        !address ||
                        (isDmGroup && members.length > 0) ||
                        members.includes(address)
                      }
                      onClick={handleAddMember}>
                      Add
                    </Button>
                  </Group>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <Text fw={700}>Added members</Text>
                      <Badge color="gray" size="lg">
                        {members.length}
                      </Badge>
                    </Group>
                    <Stack gap="4px">
                      {members.map((member) => (
                        <Group
                          key={member}
                          justify="space-between"
                          align="center">
                          <Text truncate="end" flex={1}>
                            {member}
                          </Text>
                          <Button
                            size="xs"
                            onClick={() => {
                              setMembers(members.filter((m) => m !== member));
                            }}>
                            Remove
                          </Button>
                        </Group>
                      ))}
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </ScrollArea>
          <Group gap="xs" justify="flex-end">
            <Button
              variant="default"
              onClick={() => void navigate("/conversations")}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()}>Create</Button>
          </Group>
        </Stack>
      </FocusTrap>
    </>
  );
};
