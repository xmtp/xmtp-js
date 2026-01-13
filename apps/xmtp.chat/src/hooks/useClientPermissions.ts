import { PermissionLevel, PermissionPolicy } from "@xmtp/browser-sdk";
import { useMemo } from "react";
import { useClient } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";

const hasPermission = (
  permissionLevel: PermissionLevel,
  policy?: PermissionPolicy,
) => {
  if (
    policy === undefined ||
    policy === PermissionPolicy.Deny ||
    policy === PermissionPolicy.Other ||
    policy === PermissionPolicy.DoesNotExist
  ) {
    return false;
  }
  if (policy === PermissionPolicy.Allow) {
    return true;
  }

  switch (permissionLevel) {
    case PermissionLevel.SuperAdmin:
      // super admin can do anything
      return true;
    case PermissionLevel.Admin:
      return policy === PermissionPolicy.Admin;
    default:
      return false;
  }
};

export type ClientPermissions = {
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canPromoteMembers: boolean;
  canDemoteMembers: boolean;
  canChangeGroupName: boolean;
  canChangeGroupDescription: boolean;
  canChangeGroupImage: boolean;
  canChangeMessageDisappearingPolicy: boolean;
  canChangePermissionsPolicy: boolean;
};

export const useClientPermissions = (
  conversationId: string,
): ClientPermissions => {
  const { permissions, members } = useConversation(conversationId);
  const client = useClient();

  const clientPermissionLevel: PermissionLevel = useMemo(() => {
    if (client.inboxId) {
      const member = members.get(client.inboxId);
      return member?.permissionLevel ?? PermissionLevel.Member;
    }
    return PermissionLevel.Member;
  }, [members, client.inboxId]);

  return useMemo(() => {
    return {
      canAddMembers: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.addMemberPolicy,
      ),
      canRemoveMembers: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.removeMemberPolicy,
      ),
      canPromoteMembers: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.addAdminPolicy,
      ),
      canDemoteMembers: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.removeAdminPolicy,
      ),
      canChangeGroupName: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.updateGroupNamePolicy,
      ),
      canChangeGroupDescription: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.updateGroupDescriptionPolicy,
      ),
      canChangeGroupImage: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.updateGroupImageUrlSquarePolicy,
      ),
      canChangeMessageDisappearingPolicy: hasPermission(
        clientPermissionLevel,
        permissions?.policySet.updateMessageDisappearingPolicy,
      ),
      canChangePermissionsPolicy:
        clientPermissionLevel === PermissionLevel.SuperAdmin,
    };
  }, [clientPermissionLevel, permissions]);
};
