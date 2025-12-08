import { PermissionPolicy } from "@xmtp/browser-sdk";
import { useMemo } from "react";
import { useClient } from "@/contexts/XMTPContext";
import { useConversation } from "@/hooks/useConversation";

// TODO: remove this once types are fixed
export type AdjustedPermissionLevel = "SuperAdmin" | "Admin" | "Member";

const hasPermission = (
  permissionLevel: AdjustedPermissionLevel,
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
    case "SuperAdmin":
      // super admin can do anything
      return true;
    case "Admin":
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

  const clientPermissionLevel: AdjustedPermissionLevel = useMemo(() => {
    if (client.inboxId) {
      const member = members.get(client.inboxId);
      // TODO: remove this once the types are fixed
      const level = member?.permissionLevel as unknown as
        | AdjustedPermissionLevel
        | undefined;
      return level ?? "Member";
    }
    return "Member";
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
      canChangePermissionsPolicy: clientPermissionLevel === "SuperAdmin",
    };
  }, [clientPermissionLevel, permissions]);
};
