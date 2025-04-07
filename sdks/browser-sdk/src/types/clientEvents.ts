import type {
  ConsentEntityType,
  ConsentState,
  ConversationType,
  Identifier,
  MetadataField,
  PermissionPolicy,
  PermissionUpdateType,
  SignatureRequestType,
} from "@xmtp/wasm-bindings";
import type {
  ClientOptions,
  EventsClientMessageData,
  EventsClientPostMessageData,
  EventsErrorData,
  EventsResult,
  EventsWorkerMessageData,
  EventsWorkerPostMessageData,
  SendMessageData,
} from "@/types";
import type {
  SafeConsent,
  SafeConversation,
  SafeCreateDmOptions,
  SafeCreateGroupOptions,
  SafeEncodedContent,
  SafeGroupMember,
  SafeHmacKey,
  SafeHmacKeys,
  SafeInboxState,
  SafeKeyPackageStatus,
  SafeListConversationsOptions,
  SafeListMessagesOptions,
  SafeMessage,
  SafeMessageDisappearingSettings,
} from "@/utils/conversions";

export type ClientEvents =
  /**
   * Stream actions
   */
  | {
      action: "endStream";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  /**
   * Client actions
   */
  | {
      action: "init";
      id: string;
      result: {
        inboxId: string;
        installationId: string;
        installationIdBytes: Uint8Array;
      };
      data: {
        identifier: Identifier;
        options?: ClientOptions;
      };
    }
  | {
      action: "createInboxSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "addAccountSignatureText";
      id: string;
      result: string | undefined;
      data: {
        newIdentifier: Identifier;
      };
    }
  | {
      action: "removeAccountSignatureText";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "revokeAllOtherInstallationsSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "revokeInstallationsSignatureText";
      id: string;
      result: string | undefined;
      data: {
        installationIds: Uint8Array[];
      };
    }
  | {
      action: "changeRecoveryIdentifierSignatureText";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "addEcdsaSignature";
      id: string;
      result: undefined;
      data: {
        type: SignatureRequestType;
        bytes: Uint8Array;
      };
    }
  | {
      action: "addScwSignature";
      id: string;
      result: undefined;
      data: {
        type: SignatureRequestType;
        bytes: Uint8Array;
        chainId: bigint;
        blockNumber?: bigint;
      };
    }
  | {
      action: "applySignatures";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "registerIdentity";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "isRegistered";
      id: string;
      result: boolean;
      data: undefined;
    }
  | {
      action: "canMessage";
      id: string;
      result: Map<string, boolean>;
      data: {
        identifiers: Identifier[];
      };
    }
  | {
      action: "inboxState";
      id: string;
      result: SafeInboxState;
      data: {
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "inboxStateFromInboxIds";
      id: string;
      result: SafeInboxState[];
      data: {
        inboxIds: string[];
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "getLatestInboxState";
      id: string;
      result: SafeInboxState;
      data: {
        inboxId: string;
      };
    }
  | {
      action: "setConsentStates";
      id: string;
      result: undefined;
      data: {
        records: SafeConsent[];
      };
    }
  | {
      action: "getConsentState";
      id: string;
      result: ConsentState;
      data: {
        entityType: ConsentEntityType;
        entity: string;
      };
    }
  | {
      action: "findInboxIdByIdentifier";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "signWithInstallationKey";
      id: string;
      result: Uint8Array;
      data: {
        signatureText: string;
      };
    }
  | {
      action: "verifySignedWithInstallationKey";
      id: string;
      result: boolean;
      data: {
        signatureText: string;
        signatureBytes: Uint8Array;
      };
    }
  | {
      action: "verifySignedWithPublicKey";
      id: string;
      result: boolean;
      data: {
        signatureText: string;
        signatureBytes: Uint8Array;
        publicKey: Uint8Array;
      };
    }
  | {
      action: "getKeyPackageStatusesForInstallationIds";
      id: string;
      result: Map<string, SafeKeyPackageStatus>;
      data: {
        installationIds: string[];
      };
    }
  /**
   * Conversations actions
   */
  | {
      action: "getConversationById";
      id: string;
      result: SafeConversation | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "getMessageById";
      id: string;
      result: SafeMessage | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "getDmByInboxId";
      id: string;
      result: SafeConversation | undefined;
      data: {
        inboxId: string;
      };
    }
  | {
      action: "getConversations";
      id: string;
      result: SafeConversation[];
      data: {
        options?: SafeListConversationsOptions;
      };
    }
  | {
      action: "getGroups";
      id: string;
      result: SafeConversation[];
      data: {
        options?: Omit<SafeListConversationsOptions, "conversation_type">;
      };
    }
  | {
      action: "getDms";
      id: string;
      result: SafeConversation[];
      data: {
        options?: Omit<SafeListConversationsOptions, "conversation_type">;
      };
    }
  | {
      action: "newGroupWithIdentifiers";
      id: string;
      result: SafeConversation;
      data: {
        identifiers: Identifier[];
        options?: SafeCreateGroupOptions;
      };
    }
  | {
      action: "newGroupWithInboxIds";
      id: string;
      result: SafeConversation;
      data: {
        inboxIds: string[];
        options?: SafeCreateGroupOptions;
      };
    }
  | {
      action: "newDmWithIdentifier";
      id: string;
      result: SafeConversation;
      data: {
        identifier: Identifier;
        options?: SafeCreateDmOptions;
      };
    }
  | {
      action: "newDmWithInboxId";
      id: string;
      result: SafeConversation;
      data: {
        inboxId: string;
        options?: SafeCreateDmOptions;
      };
    }
  | {
      action: "syncConversations";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "syncAllConversations";
      id: string;
      result: undefined;
      data: {
        consentStates?: ConsentState[];
      };
    }
  | {
      action: "getHmacKeys";
      id: string;
      result: SafeHmacKeys;
      data: undefined;
    }
  | {
      action: "streamAllGroups";
      id: string;
      result: undefined;
      data: {
        streamId: string;
        conversationType?: ConversationType;
      };
    }
  | {
      action: "streamAllMessages";
      id: string;
      result: undefined;
      data: {
        streamId: string;
        conversationType?: ConversationType;
      };
    }
  | {
      action: "streamConsent";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  | {
      action: "streamPreferences";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  /**
   * Group actions
   */
  | {
      action: "syncGroup";
      id: string;
      result: SafeConversation;
      data: {
        id: string;
      };
    }
  | {
      action: "sendGroupMessage";
      id: string;
      result: string;
      data: {
        id: string;
        content: SafeEncodedContent;
      };
    }
  | {
      action: "sendOptimisticGroupMessage";
      id: string;
      result: string;
      data: {
        id: string;
        content: SafeEncodedContent;
      };
    }
  | {
      action: "publishGroupMessages";
      id: string;
      result: undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "getGroupMessages";
      id: string;
      result: SafeMessage[];
      data: {
        id: string;
        options?: SafeListMessagesOptions;
      };
    }
  | {
      action: "getGroupMembers";
      id: string;
      result: SafeGroupMember[];
      data: {
        id: string;
      };
    }
  | {
      action: "getGroupAdmins";
      id: string;
      result: string[];
      data: {
        id: string;
      };
    }
  | {
      action: "getGroupSuperAdmins";
      id: string;
      result: string[];
      data: {
        id: string;
      };
    }
  | {
      action: "isGroupAdmin";
      id: string;
      result: boolean;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "isGroupSuperAdmin";
      id: string;
      result: boolean;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "addGroupMembers";
      id: string;
      result: undefined;
      data: {
        id: string;
        identifiers: Identifier[];
      };
    }
  | {
      action: "removeGroupMembers";
      id: string;
      result: undefined;
      data: {
        id: string;
        identifiers: Identifier[];
      };
    }
  | {
      action: "addGroupMembersByInboxId";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxIds: string[];
      };
    }
  | {
      action: "removeGroupMembersByInboxId";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxIds: string[];
      };
    }
  | {
      action: "addGroupAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "removeGroupAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "addGroupSuperAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "removeGroupSuperAdmin";
      id: string;
      result: undefined;
      data: {
        id: string;
        inboxId: string;
      };
    }
  | {
      action: "updateGroupName";
      id: string;
      result: undefined;
      data: {
        id: string;
        name: string;
      };
    }
  | {
      action: "updateGroupDescription";
      id: string;
      result: undefined;
      data: {
        id: string;
        description: string;
      };
    }
  | {
      action: "updateGroupImageUrlSquare";
      id: string;
      result: undefined;
      data: {
        id: string;
        imageUrl: string;
      };
    }
  | {
      action: "getGroupConsentState";
      id: string;
      result: ConsentState;
      data: {
        id: string;
      };
    }
  | {
      action: "updateGroupConsentState";
      id: string;
      result: undefined;
      data: {
        id: string;
        state: ConsentState;
      };
    }
  | {
      action: "getDmPeerInboxId";
      id: string;
      result: string;
      data: {
        id: string;
      };
    }
  | {
      action: "updateGroupPermissionPolicy";
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
      action: "getGroupPermissions";
      id: string;
      result: SafeConversation["permissions"];
      data: {
        id: string;
      };
    }
  | {
      action: "getGroupMessageDisappearingSettings";
      id: string;
      result: SafeMessageDisappearingSettings | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "updateGroupMessageDisappearingSettings";
      id: string;
      result: undefined;
      data: SafeMessageDisappearingSettings & {
        id: string;
      };
    }
  | {
      action: "removeGroupMessageDisappearingSettings";
      id: string;
      result: undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "isGroupMessageDisappearingEnabled";
      id: string;
      result: boolean;
      data: {
        id: string;
      };
    }
  | {
      action: "streamGroupMessages";
      id: string;
      result: undefined;
      data: {
        groupId: string;
        streamId: string;
      };
    }
  | {
      action: "getGroupPausedForVersion";
      id: string;
      result: string | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "getGroupHmacKeys";
      id: string;
      result: SafeHmacKey[];
      data: {
        id: string;
      };
    };
export type ClientEventsActions = ClientEvents["action"];

export type ClientEventsClientMessageData =
  EventsClientMessageData<ClientEvents>;

export type ClientEventsWorkerMessageData =
  EventsWorkerMessageData<ClientEvents>;

export type ClientEventsResult<A extends ClientEventsActions> = EventsResult<
  ClientEvents,
  A
>;

export type ClientSendMessageData<A extends ClientEventsActions> =
  SendMessageData<ClientEvents, A>;

export type ClientEventsWorkerPostMessageData<A extends ClientEventsActions> =
  EventsWorkerPostMessageData<ClientEvents, A>;

export type ClientEventsClientPostMessageData<A extends ClientEventsActions> =
  EventsClientPostMessageData<ClientEvents, A>;

export type ClientEventsErrorData = EventsErrorData<ClientEvents>;
