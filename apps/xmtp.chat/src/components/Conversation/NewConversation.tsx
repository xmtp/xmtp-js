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
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  GroupPermissionsOptions,
  PermissionPolicy,
  type PermissionPolicySet,
} from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { isValidLongWalletAddress } from "@/helpers/address";
import { useBodyClass } from "@/hooks/useBodyClass";
import { useConversations } from "@/hooks/useConversations";

type AnyFn = (...args: unknown[]) => unknown;
type ClassProperties<C> = {
  [K in keyof C as C[K] extends AnyFn ? never : K]: C[K];
};
type PolicySet = ClassProperties<PermissionPolicySet>;

export const NewConversation: React.FC = () => {
  useBodyClass("main-flex-layout");
  const navigate = useNavigate();
  const { newGroup, newDm, loading } = useConversations();
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [isDmGroup, setIsDmGroup] = useState(false);
  const [permissionsPolicy, setPermissionsPolicy] =
    useState<GroupPermissionsOptions>(GroupPermissionsOptions.Default);
  const [policySet, setPolicySet] = useState<PolicySet>({
    addAdminPolicy: PermissionPolicy.Admin,
    addMemberPolicy: PermissionPolicy.Admin,
    removeAdminPolicy: PermissionPolicy.Admin,
    removeMemberPolicy: PermissionPolicy.Admin,
    updateGroupDescriptionPolicy: PermissionPolicy.Allow,
    updateGroupImageUrlSquarePolicy: PermissionPolicy.Allow,
    updateGroupNamePolicy: PermissionPolicy.Allow,
    updateGroupPinnedFrameUrlPolicy: PermissionPolicy.Allow,
    updateMessageExpirationPolicy: PermissionPolicy.Allow,
  });
  const [createConversationError, setCreateConversationError] = useState<
    string | null
  >(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pinnedFrameUrl, setPinnedFrameUrl] = useState("");

  const policyTooltip = useMemo(() => {
    if (permissionsPolicy === GroupPermissionsOptions.Default) {
      return "All members of the group can perform group actions";
    } else if (permissionsPolicy === GroupPermissionsOptions.AdminOnly) {
      return "Only admins can perform group actions";
    }
    return "Custom policy as defined below";
  }, [permissionsPolicy]);

  useEffect(() => {
    if (
      permissionsPolicy === GroupPermissionsOptions.Default ||
      permissionsPolicy === GroupPermissionsOptions.CustomPolicy
    ) {
      setPolicySet({
        addAdminPolicy: PermissionPolicy.Admin,
        addMemberPolicy: PermissionPolicy.Admin,
        removeAdminPolicy: PermissionPolicy.Admin,
        removeMemberPolicy: PermissionPolicy.Admin,
        updateGroupDescriptionPolicy: PermissionPolicy.Allow,
        updateGroupImageUrlSquarePolicy: PermissionPolicy.Allow,
        updateGroupNamePolicy: PermissionPolicy.Allow,
        updateGroupPinnedFrameUrlPolicy: PermissionPolicy.Allow,
        updateMessageExpirationPolicy: PermissionPolicy.Admin,
      });
    } else {
      setPolicySet({
        addAdminPolicy: PermissionPolicy.Admin,
        addMemberPolicy: PermissionPolicy.Admin,
        removeAdminPolicy: PermissionPolicy.Admin,
        removeMemberPolicy: PermissionPolicy.Admin,
        updateGroupDescriptionPolicy: PermissionPolicy.Admin,
        updateGroupImageUrlSquarePolicy: PermissionPolicy.Admin,
        updateGroupNamePolicy: PermissionPolicy.Admin,
        updateGroupPinnedFrameUrlPolicy: PermissionPolicy.Admin,
        updateMessageExpirationPolicy: PermissionPolicy.Admin,
      });
    }
  }, [permissionsPolicy]);

  useEffect(() => {
    if (members.includes(address)) {
      setAddressError("Duplicate address");
    } else if (address && !isValidLongWalletAddress(address)) {
      setAddressError("Invalid address");
    } else {
      setAddressError(null);
    }
  }, [members, address]);

  const handleCreate = async () => {
    if (isDmGroup && members.length === 0) {
      setCreateConversationError(
        "Direct message groups must have at least one member",
      );
      return;
    }
    const conversation = isDmGroup
      ? await newDm(members[0])
      : await newGroup(members, {
          description,
          imageUrlSquare: imageUrl,
          pinnedFrameUrl,
          name,
          permissions: permissionsPolicy,
          customPermissionPolicySet:
            permissionsPolicy === GroupPermissionsOptions.CustomPolicy
              ? policySet
              : undefined,
        });
    // automatically sync when creating a group with no members
    if (!isDmGroup && members.length === 0) {
      await conversation.sync();
    }
    void navigate(`/conversations/${conversation.id}`);
  };

  const handleAddMember = () => {
    setMembers([...members, address]);
    setAddress("");
    setAddressError(null);
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
          <LoadingOverlay visible={loading} />
          <Title order={3}>New conversation</Title>
          <ScrollArea type="scroll" className="scrollfade">
            <Stack gap="lg" py="md">
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
                  <Group gap="md" align="center" wrap="nowrap">
                    <Text flex="1 1 40%">Name</Text>
                    <TextInput
                      flex="1 1 60%"
                      disabled={isDmGroup}
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                      }}
                    />
                  </Group>
                  <Group gap="md" align="flex-start" wrap="nowrap">
                    <Text flex="1 1 40%">Description</Text>
                    <Textarea
                      flex="1 1 60%"
                      disabled={isDmGroup}
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                      }}
                    />
                  </Group>
                  <Group gap="md" align="center" wrap="nowrap">
                    <Text flex="1 1 40%">Image URL</Text>
                    <TextInput
                      flex="1 1 60%"
                      disabled={isDmGroup}
                      value={imageUrl}
                      onChange={(event) => {
                        setImageUrl(event.target.value);
                      }}
                    />
                  </Group>
                  <Group gap="md" align="center" wrap="nowrap">
                    <Text flex="1 1 40%">Pinned frame URL</Text>
                    <TextInput
                      flex="1 1 60%"
                      disabled={isDmGroup}
                      value={pinnedFrameUrl}
                      onChange={(event) => {
                        setPinnedFrameUrl(event.target.value);
                      }}
                    />
                  </Group>
                </Stack>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="md" justify="space-between">
                    <Title order={4}>Permissions</Title>
                    <Group gap="xs">
                      <Text>Policy</Text>
                      <Tooltip withArrow label={policyTooltip}>
                        <NativeSelect
                          disabled={isDmGroup}
                          value={permissionsPolicy}
                          onChange={(event) => {
                            setPermissionsPolicy(
                              parseInt(
                                event.currentTarget.value,
                                10,
                              ) as GroupPermissionsOptions,
                            );
                          }}
                          data={[
                            { value: "0", label: "Default" },
                            { value: "1", label: "Admins only" },
                            { value: "2", label: "Custom policy" },
                          ]}
                        />
                      </Tooltip>
                    </Group>
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Add members</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.addMemberPolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          addMemberPolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Remove members</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.removeMemberPolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          removeMemberPolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Add admins</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.addAdminPolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          addAdminPolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Remove admins</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.removeAdminPolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          removeAdminPolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Update group name</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.updateGroupNamePolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          updateGroupNamePolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "0", label: "Everyone" },
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Update group description</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.updateGroupDescriptionPolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          updateGroupDescriptionPolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "0", label: "Everyone" },
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Update group image</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.updateGroupImageUrlSquarePolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          updateGroupImageUrlSquarePolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "0", label: "Everyone" },
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                  <Group gap="md" justify="space-between" align="center">
                    <Text>Update group pinned frame</Text>
                    <NativeSelect
                      disabled={
                        isDmGroup ||
                        permissionsPolicy !==
                          GroupPermissionsOptions.CustomPolicy
                      }
                      value={policySet.updateGroupPinnedFrameUrlPolicy}
                      onChange={(event) => {
                        setPolicySet({
                          ...policySet,
                          updateGroupPinnedFrameUrlPolicy: parseInt(
                            event.currentTarget.value,
                            10,
                          ) as PermissionPolicy,
                        });
                      }}
                      data={[
                        { value: "0", label: "Everyone" },
                        { value: "1", label: "Disabled" },
                        { value: "2", label: "Admins only" },
                        { value: "3", label: "Super admins only" },
                      ]}
                    />
                  </Group>
                </Stack>
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Members</Title>
                  <Group gap="xs" align="flex-start">
                    <Stack flex={1} gap="xs">
                      <TextInput
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
                      mt="1.5rem"
                      disabled={
                        !address ||
                        (isDmGroup && members.length > 0) ||
                        addressError !== null
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
