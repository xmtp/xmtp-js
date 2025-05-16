import type {
  Identifier,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
} from "@xmtp/wasm-bindings";
import type { SafeConversation } from "@/utils/conversions";

export type GroupAction =
  | {
      action: "group.listAdmins";
      id: string;
      result: string[];
      data: {
        id: string;
      };
    }
  | {
      action: "group.listSuperAdmins";
      id: string;
      result: string[];
      data: {
        id: string;
      };
    }
  | {
      action: "group.isAdmin";
      id: string;
      result: boolean;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "group.isSuperAdmin";
      id: string;
      result: boolean;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "group.addMembersByIdentifiers";
      id: string;
      result: undefined;
      data: {
        id: string;
        identifiers: Identifier[];
      };
    }
  | {
      action: "group.removeMembersByIdentifiers";
      id: string;
      result: undefined;
      data: {
        id: string;
        identifiers: Identifier[];
      };
    }
  | {
      action: "group.addMembers";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxIds: string[];
      };
    }
  | {
      action: "group.removeMembers";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxIds: string[];
      };
    }
  | {
      action: "group.addAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "group.removeAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "group.addSuperAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "group.removeSuperAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "group.updateName";
      id: string;
      result: undefined;
      data: {
        id: string;
        name: string;
      };
    }
  | {
      action: "group.updateDescription";
      id: string;
      result: undefined;
      data: {
        id: string;
        description: string;
      };
    }
  | {
      action: "group.updateImageUrl";
      id: string;
      result: undefined;
      data: {
        id: string;
        imageUrl: string;
      };
    }
  | {
      action: "group.updatePermission";
      id: string;
      result: undefined;
      data: {
        id: string;
        permissionType: PermissionUpdateType;
        policy: PermissionPolicy;
        metadataField?: MetadataField;
      };
    }
  | {
      action: "group.permissions";
      id: string;
      result: SafeConversation["permissions"];
      data: {
        id: string;
      };
    };
