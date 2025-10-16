import { Box, Group, NativeSelect, Stack, Text, Tooltip } from "@mantine/core";
import {
  GroupPermissionsOptions,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  Group as XmtpGroup,
  type Conversation,
} from "@xmtp/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import type { PolicySet } from "@/types";

const PERMISSION_VALUES = [
  { value: "0", label: "Everyone" },
  { value: "1", label: "Disabled" },
  { value: "2", label: "Admin only" },
  { value: "3", label: "Super admin only" },
];

export const defaultPolicySet: PolicySet = {
  addAdminPolicy: PermissionPolicy.SuperAdmin,
  addMemberPolicy: PermissionPolicy.Allow,
  removeAdminPolicy: PermissionPolicy.SuperAdmin,
  removeMemberPolicy: PermissionPolicy.Admin,
  updateGroupNamePolicy: PermissionPolicy.Allow,
  updateGroupDescriptionPolicy: PermissionPolicy.Allow,
  updateGroupImageUrlSquarePolicy: PermissionPolicy.Allow,
  updateMessageDisappearingPolicy: PermissionPolicy.Admin,
};

export const adminPolicySet: PolicySet = {
  addAdminPolicy: PermissionPolicy.SuperAdmin,
  addMemberPolicy: PermissionPolicy.Admin,
  removeAdminPolicy: PermissionPolicy.SuperAdmin,
  removeMemberPolicy: PermissionPolicy.Admin,
  updateGroupNamePolicy: PermissionPolicy.Admin,
  updateGroupDescriptionPolicy: PermissionPolicy.Admin,
  updateGroupImageUrlSquarePolicy: PermissionPolicy.Admin,
  updateMessageDisappearingPolicy: PermissionPolicy.Admin,
};

export const processPermissionsUpdate = async (
  conversation: Conversation,
  permissionsPolicy: GroupPermissionsOptions,
  policySet: PolicySet,
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
      MetadataField.ImageUrlSquare,
    );
  }
};

export type PermissionsProps = {
  conversation?: Conversation;
  onPermissionsPolicyChange: (
    permissionsPolicy: GroupPermissionsOptions,
  ) => void;
  onPolicySetChange: (policySet: PolicySet) => void;
};

export const Permissions: React.FC<PermissionsProps> = ({
  conversation,
  onPermissionsPolicyChange,
  onPolicySetChange,
}) => {
  const [permissionsPolicy, setPermissionsPolicy] =
    useState<GroupPermissionsOptions>(GroupPermissionsOptions.Default);
  const [policySet, setPolicySet] = useState<PolicySet>(defaultPolicySet);

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
            data={PERMISSION_VALUES}
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
            data={PERMISSION_VALUES}
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
            data={PERMISSION_VALUES}
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
            data={PERMISSION_VALUES}
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
            data={PERMISSION_VALUES}
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
            data={PERMISSION_VALUES}
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
            data={PERMISSION_VALUES}
          />
        </Group>
      </Stack>
    </Box>
  );
};
