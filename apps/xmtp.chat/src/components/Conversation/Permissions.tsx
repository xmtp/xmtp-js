import { Box, Group, NativeSelect, Stack, Text, Tooltip } from "@mantine/core";
import {
  GroupPermissionsOptions,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Group as XmtpGroup,
  type Conversation,
  type PermissionPolicySet,
} from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";

const PERMISSION_VALUES = [
  { value: "0", label: "Everyone" },
  { value: "1", label: "Disabled" },
  { value: "2", label: "Admin only" },
  { value: "3", label: "Super admin only" },
];

const toPermissionValue = (permission: PermissionPolicy) => {
  switch (permission) {
    case PermissionPolicy.Allow:
      return "0";
    case PermissionPolicy.Deny:
      return "1";
    case PermissionPolicy.Admin:
      return "2";
    case PermissionPolicy.SuperAdmin:
      return "3";
  }
};

export const defaultPolicySet: PermissionPolicySet = {
  addAdminPolicy: PermissionPolicy.SuperAdmin,
  addMemberPolicy: PermissionPolicy.Allow,
  removeAdminPolicy: PermissionPolicy.SuperAdmin,
  removeMemberPolicy: PermissionPolicy.Admin,
  updateGroupNamePolicy: PermissionPolicy.Allow,
  updateGroupDescriptionPolicy: PermissionPolicy.Allow,
  updateGroupImageUrlSquarePolicy: PermissionPolicy.Allow,
  updateMessageDisappearingPolicy: PermissionPolicy.Admin,
  updateAppDataPolicy: PermissionPolicy.Allow,
};

export const adminPolicySet: PermissionPolicySet = {
  addAdminPolicy: PermissionPolicy.SuperAdmin,
  addMemberPolicy: PermissionPolicy.Admin,
  removeAdminPolicy: PermissionPolicy.SuperAdmin,
  removeMemberPolicy: PermissionPolicy.Admin,
  updateGroupNamePolicy: PermissionPolicy.Admin,
  updateGroupDescriptionPolicy: PermissionPolicy.Admin,
  updateGroupImageUrlSquarePolicy: PermissionPolicy.Admin,
  updateMessageDisappearingPolicy: PermissionPolicy.Admin,
  updateAppDataPolicy: PermissionPolicy.Admin,
};

export const processPermissionsUpdate = async (
  conversation: Conversation,
  permissionsPolicy: GroupPermissionsOptions,
  policySet: PermissionPolicySet,
) => {
  if (!(conversation instanceof XmtpGroup)) {
    return;
  }

  const permissions = await conversation.permissions();

  // policy type has changed and is not a custom policy
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
          MetadataField.GroupImageUrlSquare,
        );
        await conversation.updatePermission(
          PermissionUpdateType.UpdateMetadata,
          defaultPolicySet.updateAppDataPolicy,
          MetadataField.AppData,
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
          MetadataField.GroupImageUrlSquare,
        );
        await conversation.updatePermission(
          PermissionUpdateType.UpdateMetadata,
          adminPolicySet.updateAppDataPolicy,
          MetadataField.AppData,
        );
      }
    }
  }

  // policy type is a custom policy
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
      MetadataField.GroupImageUrlSquare,
    );
    await conversation.updatePermission(
      PermissionUpdateType.UpdateMetadata,
      policySet.updateAppDataPolicy,
      MetadataField.AppData,
    );
  }
};

export type PermissionsProps = {
  conversation?: Conversation;
  onPermissionsPolicyChange: (
    permissionsPolicy: GroupPermissionsOptions,
  ) => void;
  onPolicySetChange: (policySet: PermissionPolicySet) => void;
};

export const Permissions: React.FC<PermissionsProps> = ({
  conversation,
  onPermissionsPolicyChange,
  onPolicySetChange,
}) => {
  const [permissionsPolicy, setPermissionsPolicy] =
    useState<GroupPermissionsOptions>(GroupPermissionsOptions.Default);
  const [policySet, setPolicySet] =
    useState<PermissionPolicySet>(defaultPolicySet);

  const policyTooltip = useMemo(() => {
    if (permissionsPolicy === GroupPermissionsOptions.Default) {
      return "All members of the group can perform group actions";
    } else if (permissionsPolicy === GroupPermissionsOptions.AdminOnly) {
      return "Only admins can perform group actions";
    }
    return "Custom policy as defined below";
  }, [permissionsPolicy]);

  useEffect(() => {
    switch (permissionsPolicy) {
      case GroupPermissionsOptions.Default:
        setPolicySet(defaultPolicySet);
        break;
      case GroupPermissionsOptions.AdminOnly:
        setPolicySet(adminPolicySet);
        break;
    }
    onPermissionsPolicyChange(permissionsPolicy);
  }, [permissionsPolicy]);

  useEffect(() => {
    onPolicySetChange(policySet);
  }, [policySet]);

  useEffect(() => {
    if (!conversation || !(conversation instanceof XmtpGroup)) {
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
  }, [conversation?.id]);

  return (
    <Box p="md">
      <Stack gap="md">
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Policy</Text>
          <Tooltip withArrow label={<Text size="xs">{policyTooltip}</Text>}>
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
                { value: "1", label: "Admin only" },
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
            value={toPermissionValue(policySet.addMemberPolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                addMemberPolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Remove members</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.removeMemberPolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                removeMemberPolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Add admins</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.addAdminPolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                addAdminPolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Remove admins</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.removeAdminPolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                removeAdminPolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Update group name</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.updateGroupNamePolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                updateGroupNamePolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Update group description</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.updateGroupDescriptionPolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                updateGroupDescriptionPolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Update group image</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.updateGroupImageUrlSquarePolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                updateGroupImageUrlSquarePolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
        <Group gap="md" justify="space-between" align="center">
          <Text size="sm">Update app data</Text>
          <NativeSelect
            disabled={
              permissionsPolicy !== GroupPermissionsOptions.CustomPolicy
            }
            value={toPermissionValue(policySet.updateAppDataPolicy)}
            onChange={(event) => {
              setPolicySet({
                ...policySet,
                updateAppDataPolicy: parseInt(
                  event.currentTarget.value,
                  10,
                ) as PermissionPolicy,
              });
            }}
            data={PERMISSION_VALUES}
          />
        </Group>
      </Stack>
    </Box>
  );
};
