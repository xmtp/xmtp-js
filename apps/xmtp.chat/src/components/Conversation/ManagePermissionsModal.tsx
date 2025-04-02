import {
  Box,
  Button,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  GroupPermissionsOptions,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Group as XmtpGroup,
  type PermissionPolicySet,
} from "@xmtp/browser-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import type { ConversationOutletContext } from "@/components/Conversation/ConversationOutletContext";
import { useCollapsedMediaQuery } from "@/hooks/useCollapsedMediaQuery";
import { ContentLayout } from "@/layouts/ContentLayout";

type AnyFn = (...args: unknown[]) => unknown;
type ClassProperties<C> = {
  [K in keyof C as C[K] extends AnyFn ? never : K]: C[K];
};
type PolicySet = ClassProperties<PermissionPolicySet>;

const defaultPolicySet: PolicySet = {
  addAdminPolicy: PermissionPolicy.SuperAdmin,
  addMemberPolicy: PermissionPolicy.Allow,
  removeAdminPolicy: PermissionPolicy.SuperAdmin,
  removeMemberPolicy: PermissionPolicy.Admin,
  updateGroupNamePolicy: PermissionPolicy.Allow,
  updateGroupDescriptionPolicy: PermissionPolicy.Allow,
  updateGroupImageUrlSquarePolicy: PermissionPolicy.Allow,
  updateMessageDisappearingPolicy: PermissionPolicy.Admin,
};

const adminPolicySet: PolicySet = {
  addAdminPolicy: PermissionPolicy.SuperAdmin,
  addMemberPolicy: PermissionPolicy.Admin,
  removeAdminPolicy: PermissionPolicy.SuperAdmin,
  removeMemberPolicy: PermissionPolicy.Admin,
  updateGroupNamePolicy: PermissionPolicy.Admin,
  updateGroupDescriptionPolicy: PermissionPolicy.Admin,
  updateGroupImageUrlSquarePolicy: PermissionPolicy.Admin,
  updateMessageDisappearingPolicy: PermissionPolicy.Admin,
};

export const ManagePermissionsModal: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsPolicy, setPermissionsPolicy] =
    useState<GroupPermissionsOptions>(GroupPermissionsOptions.Default);
  const [policySet, setPolicySet] = useState<PolicySet>(defaultPolicySet);

  const { conversation } = useOutletContext<ConversationOutletContext>();
  const navigate = useNavigate();

  const fullScreen = useCollapsedMediaQuery();
  const contentHeight = fullScreen ? "auto" : 500;

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
      setPolicySet(defaultPolicySet);
    } else {
      setPolicySet(adminPolicySet);
    }
  }, [permissionsPolicy]);

  useEffect(() => {
    if (!(conversation instanceof XmtpGroup)) {
      return;
    }

    const loadPermissions = async () => {
      const permissions = await conversation.permissions();
      const policyType = permissions.policyType;
      switch (policyType) {
        case GroupPermissionsOptions.Default:
          setPermissionsPolicy(GroupPermissionsOptions.Default);
          setPolicySet(defaultPolicySet);
          break;
        case GroupPermissionsOptions.AdminOnly:
          setPermissionsPolicy(GroupPermissionsOptions.AdminOnly);
          setPolicySet(adminPolicySet);
          break;
        case GroupPermissionsOptions.CustomPolicy:
          setPermissionsPolicy(GroupPermissionsOptions.CustomPolicy);
          setPolicySet(permissions.policySet);
          break;
      }
    };
    void loadPermissions();
  }, [conversation.id]);

  const handleClose = useCallback(() => {
    void navigate(`/conversations/${conversation.id}`);
  }, [navigate, conversation.id]);

  const handleUpdate = useCallback(async () => {
    if (!(conversation instanceof XmtpGroup)) {
      return;
    }
    setIsLoading(true);
    try {
      const permissions = await conversation.permissions();
      if (
        permissions.policyType !== permissionsPolicy &&
        permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
      ) {
        switch (permissionsPolicy) {
          case GroupPermissionsOptions.Default: {
            await conversation.updatePermission(
              PermissionUpdateType.AddMember,
              defaultPolicySet.addMemberPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.RemoveMember,
              defaultPolicySet.removeMemberPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.AddAdmin,
              defaultPolicySet.addAdminPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.RemoveAdmin,
              defaultPolicySet.removeAdminPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.UpdateMetadata,
              defaultPolicySet.updateGroupNamePolicy,
              MetadataField.GroupName,
            );
            await conversation.updatePermission(
              PermissionUpdateType.UpdateMetadata,
              defaultPolicySet.updateGroupDescriptionPolicy,
              MetadataField.Description,
            );
            await conversation.updatePermission(
              PermissionUpdateType.UpdateMetadata,
              defaultPolicySet.updateGroupImageUrlSquarePolicy,
              MetadataField.ImageUrlSquare,
            );
            break;
          }
          case GroupPermissionsOptions.AdminOnly: {
            await conversation.updatePermission(
              PermissionUpdateType.AddMember,
              adminPolicySet.addMemberPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.RemoveMember,
              adminPolicySet.removeMemberPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.AddAdmin,
              adminPolicySet.addAdminPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.RemoveAdmin,
              adminPolicySet.removeAdminPolicy,
            );
            await conversation.updatePermission(
              PermissionUpdateType.UpdateMetadata,
              adminPolicySet.updateGroupNamePolicy,
              MetadataField.GroupName,
            );
            await conversation.updatePermission(
              PermissionUpdateType.UpdateMetadata,
              adminPolicySet.updateGroupDescriptionPolicy,
              MetadataField.Description,
            );
            await conversation.updatePermission(
              PermissionUpdateType.UpdateMetadata,
              adminPolicySet.updateGroupImageUrlSquarePolicy,
              MetadataField.ImageUrlSquare,
            );
          }
        }
      }
      if (permissionsPolicy === GroupPermissionsOptions.CustomPolicy) {
        await conversation.updatePermission(
          PermissionUpdateType.AddMember,
          policySet.addMemberPolicy,
        );
        await conversation.updatePermission(
          PermissionUpdateType.RemoveMember,
          policySet.removeMemberPolicy,
        );
        await conversation.updatePermission(
          PermissionUpdateType.AddAdmin,
          policySet.addAdminPolicy,
        );
        await conversation.updatePermission(
          PermissionUpdateType.RemoveAdmin,
          policySet.removeAdminPolicy,
        );
        await conversation.updatePermission(
          PermissionUpdateType.UpdateMetadata,
          policySet.updateGroupNamePolicy,
          MetadataField.GroupName,
        );
        await conversation.updatePermission(
          PermissionUpdateType.UpdateMetadata,
          policySet.updateGroupDescriptionPolicy,
          MetadataField.Description,
        );
        await conversation.updatePermission(
          PermissionUpdateType.UpdateMetadata,
          policySet.updateGroupImageUrlSquarePolicy,
          MetadataField.ImageUrlSquare,
        );
      }
      void navigate(`/conversations/${conversation.id}`);
    } finally {
      setIsLoading(false);
    }
  }, [conversation.id, permissionsPolicy, policySet, navigate]);

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
      size="auto"
      padding={0}
      title={
        <Text size="lg" fw={700} c="text.primary" p="md">
          Manage permissions
        </Text>
      }>
      <ContentLayout
        maxHeight={contentHeight}
        footer={footer}
        withScrollAreaPadding={false}>
        <Box p="md">
          <Stack gap="md">
            <Group gap="md" justify="space-between" align="center">
              <Text size="sm">Policy</Text>
              <Tooltip withArrow label={policyTooltip}>
                <NativeSelect
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
            <Group gap="md" justify="space-between" align="center">
              <Text size="sm">Add members</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
              <Text size="sm">Remove members</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
              <Text size="sm">Add admins</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
              <Text size="sm">Remove admins</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
              <Text size="sm">Update group name</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
              <Text size="sm">Update group description</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
              <Text size="sm">Update group image</Text>
              <NativeSelect
                disabled={
                  permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
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
          </Stack>
        </Box>
      </ContentLayout>
    </Modal>
  );
};
