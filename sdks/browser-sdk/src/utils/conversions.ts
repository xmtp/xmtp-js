import type {
  GroupMetadata,
  GroupPermissionsOptions,
  HmacKey,
  PermissionPolicySet,
} from "@xmtp/wasm-bindings";
import type { WorkerConversation } from "@/WorkerConversation";

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
  metadata: GroupMetadata;
  admins: string[];
  superAdmins: string[];
  createdAtNs: bigint;
};

export const toSafeConversation = async (
  conversation: WorkerConversation,
): Promise<SafeConversation> => {
  return {
    id: conversation.id,
    name: conversation.name,
    imageUrl: conversation.imageUrl,
    description: conversation.description,
    appData: conversation.appData,
    permissions: conversation.permissions,
    addedByInboxId: conversation.addedByInboxId,
    metadata: await conversation.metadata(),
    admins: conversation.admins,
    superAdmins: conversation.superAdmins,
    createdAtNs: conversation.createdAtNs,
  };
};

export type HmacKeys = Map<string, HmacKey[]>;

export type LastReadTimes = Map<string, bigint>;
