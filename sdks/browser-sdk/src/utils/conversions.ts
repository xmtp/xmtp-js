import type {
  GroupPermissionsOptions,
  HmacKey,
  PermissionPolicy as XmtpPermissionPolicy,
  PermissionPolicySet as XmtpPermissionPolicySet,
} from "@xmtp/wasm-bindings";
import type { WorkerConversation } from "@/WorkerConversation";

export const enum PermissionPolicy {
  Allow = 0,
  Deny = 1,
  Admin = 2,
  SuperAdmin = 3,
  DoesNotExist = 4,
  Other = 5,
}

export type PermissionPolicySet = {
  addAdminPolicy: PermissionPolicy;
  addMemberPolicy: PermissionPolicy;
  removeAdminPolicy: PermissionPolicy;
  removeMemberPolicy: PermissionPolicy;
  updateGroupDescriptionPolicy: PermissionPolicy;
  updateGroupImageUrlSquarePolicy: PermissionPolicy;
  updateGroupNamePolicy: PermissionPolicy;
  updateMessageDisappearingPolicy: PermissionPolicy;
};

export const fromPermissionPolicy = (
  policy: XmtpPermissionPolicy,
): PermissionPolicy => {
  switch (policy) {
    case "allow":
      return PermissionPolicy.Allow;
    case "deny":
      return PermissionPolicy.Deny;
    case "admin":
      return PermissionPolicy.Admin;
    case "superAdmin":
      return PermissionPolicy.SuperAdmin;
    case "doesNotExist":
      return PermissionPolicy.DoesNotExist;
  }
  return PermissionPolicy.Other;
};

export const fromPermissionPolicySet = (
  policySet: XmtpPermissionPolicySet,
): PermissionPolicySet => {
  return Object.keys(policySet).reduce((acc, key) => {
    acc[key as keyof PermissionPolicySet] = fromPermissionPolicy(
      policySet[key as keyof XmtpPermissionPolicySet],
    );
    return acc;
  }, {} as PermissionPolicySet);
};

export type SafeConversation = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  appData: string;
  permissions: {
    policyType: GroupPermissionsOptions;
    policySet: PermissionPolicySet;
  };
  addedByInboxId: string;
  metadata: {
    creatorInboxId: string;
    conversationType: string;
  };
  admins: string[];
  superAdmins: string[];
  createdAtNs: bigint;
  isCommitLogForked?: boolean;
};

export const toSafeConversation = async (
  conversation: WorkerConversation,
): Promise<SafeConversation> => {
  const id = conversation.id;
  const name = conversation.name;
  const imageUrl = conversation.imageUrl;
  const description = conversation.description;
  const appData = conversation.appData;
  const permissions = conversation.permissions;
  const addedByInboxId = conversation.addedByInboxId;
  const metadata = await conversation.metadata();
  const admins = conversation.admins;
  const superAdmins = conversation.superAdmins;
  const createdAtNs = conversation.createdAtNs;
  const policyType = permissions.policyType;
  const policySet = permissions.policySet;
  const isCommitLogForked = conversation.isCommitLogForked;
  return {
    id,
    name,
    imageUrl,
    description,
    appData,
    permissions: {
      policyType,
      policySet: fromPermissionPolicySet(policySet),
    },
    addedByInboxId,
    metadata,
    admins,
    superAdmins,
    createdAtNs,
    isCommitLogForked,
  };
};

export type HmacKeys = Map<string, HmacKey[]>;

export type LastReadTimes = Map<string, bigint>;
