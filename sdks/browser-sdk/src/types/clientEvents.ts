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
  SafeConversationDebugInfo,
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
      action: "client.init";
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
      action: "client.createInboxSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "client.addAccountSignatureText";
      id: string;
      result: string | undefined;
      data: {
        newIdentifier: Identifier;
      };
    }
  | {
      action: "client.removeAccountSignatureText";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "client.revokeAllOtherInstallationsSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "client.revokeInstallationsSignatureText";
      id: string;
      result: string | undefined;
      data: {
        installationIds: Uint8Array[];
      };
    }
  | {
      action: "client.changeRecoveryIdentifierSignatureText";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "client.addEcdsaSignature";
      id: string;
      result: undefined;
      data: {
        type: SignatureRequestType;
        bytes: Uint8Array;
      };
    }
  | {
      action: "client.addScwSignature";
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
      action: "client.applySignatures";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "client.registerIdentity";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "client.isRegistered";
      id: string;
      result: boolean;
      data: undefined;
    }
  | {
      action: "client.canMessage";
      id: string;
      result: Map<string, boolean>;
      data: {
        identifiers: Identifier[];
      };
    }
  | {
      action: "client.findInboxIdByIdentifier";
      id: string;
      result: string | undefined;
      data: {
        identifier: Identifier;
      };
    }
  | {
      action: "client.signWithInstallationKey";
      id: string;
      result: Uint8Array;
      data: {
        signatureText: string;
      };
    }
  | {
      action: "client.verifySignedWithInstallationKey";
      id: string;
      result: boolean;
      data: {
        signatureText: string;
        signatureBytes: Uint8Array;
      };
    }
  | {
      action: "client.verifySignedWithPublicKey";
      id: string;
      result: boolean;
      data: {
        signatureText: string;
        signatureBytes: Uint8Array;
        publicKey: Uint8Array;
      };
    }
  | {
      action: "client.getKeyPackageStatusesForInstallationIds";
      id: string;
      result: Map<string, SafeKeyPackageStatus>;
      data: {
        installationIds: string[];
      };
    }
  /**
   * Preferences actions
   */
  | {
      action: "preferences.inboxState";
      id: string;
      result: SafeInboxState;
      data: {
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "preferences.inboxStateFromInboxIds";
      id: string;
      result: SafeInboxState[];
      data: {
        inboxIds: string[];
        refreshFromNetwork: boolean;
      };
    }
  | {
      action: "preferences.getLatestInboxState";
      id: string;
      result: SafeInboxState;
      data: {
        inboxId: string;
      };
    }
  | {
      action: "preferences.setConsentStates";
      id: string;
      result: undefined;
      data: {
        records: SafeConsent[];
      };
    }
  | {
      action: "preferences.getConsentState";
      id: string;
      result: ConsentState;
      data: {
        entityType: ConsentEntityType;
        entity: string;
      };
    }
  | {
      action: "preferences.sync";
      id: string;
      result: number;
      data: undefined;
    }
  | {
      action: "preferences.streamConsent";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  | {
      action: "preferences.streamPreferences";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    }
  /**
   * Conversations actions
   */
  | {
      action: "conversations.getConversationById";
      id: string;
      result: SafeConversation | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversations.getMessageById";
      id: string;
      result: SafeMessage | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversations.getDmByInboxId";
      id: string;
      result: SafeConversation | undefined;
      data: {
        inboxId: string;
      };
    }
  | {
      action: "conversations.list";
      id: string;
      result: SafeConversation[];
      data: {
        options?: SafeListConversationsOptions;
      };
    }
  | {
      action: "conversations.listGroups";
      id: string;
      result: SafeConversation[];
      data: {
        options?: Omit<SafeListConversationsOptions, "conversation_type">;
      };
    }
  | {
      action: "conversations.listDms";
      id: string;
      result: SafeConversation[];
      data: {
        options?: Omit<SafeListConversationsOptions, "conversation_type">;
      };
    }
  | {
      action: "conversations.newGroupOptimistic";
      id: string;
      result: SafeConversation;
      data: {
        options?: SafeCreateGroupOptions;
      };
    }
  | {
      action: "conversations.newGroupWithIdentifiers";
      id: string;
      result: SafeConversation;
      data: {
        identifiers: Identifier[];
        options?: SafeCreateGroupOptions;
      };
    }
  | {
      action: "conversations.newGroup";
      id: string;
      result: SafeConversation;
      data: {
        inboxIds: string[];
        options?: SafeCreateGroupOptions;
      };
    }
  | {
      action: "conversations.newDmWithIdentifier";
      id: string;
      result: SafeConversation;
      data: {
        identifier: Identifier;
        options?: SafeCreateDmOptions;
      };
    }
  | {
      action: "conversations.newDm";
      id: string;
      result: SafeConversation;
      data: {
        inboxId: string;
        options?: SafeCreateDmOptions;
      };
    }
  | {
      action: "conversations.sync";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "conversations.syncAll";
      id: string;
      result: undefined;
      data: {
        consentStates?: ConsentState[];
      };
    }
  | {
      action: "conversations.getHmacKeys";
      id: string;
      result: SafeHmacKeys;
      data: undefined;
    }
  | {
      action: "conversations.stream";
      id: string;
      result: undefined;
      data: {
        streamId: string;
        conversationType?: ConversationType;
      };
    }
  | {
      action: "conversations.streamAllMessages";
      id: string;
      result: undefined;
      data: {
        streamId: string;
        conversationType?: ConversationType;
        consentStates?: ConsentState[];
      };
    }
  /**
   * Conversation actions
   */
  | {
      action: "conversation.sync";
      id: string;
      result: SafeConversation;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.send";
      id: string;
      result: string;
      data: {
        id: string;
        content: SafeEncodedContent;
      };
    }
  | {
      action: "conversation.sendOptimistic";
      id: string;
      result: string;
      data: {
        id: string;
        content: SafeEncodedContent;
      };
    }
  | {
      action: "conversation.publishMessages";
      id: string;
      result: undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.messages";
      id: string;
      result: SafeMessage[];
      data: {
        id: string;
        options?: SafeListMessagesOptions;
      };
    }
  | {
      action: "conversation.members";
      id: string;
      result: SafeGroupMember[];
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.messageDisappearingSettings";
      id: string;
      result: SafeMessageDisappearingSettings | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.updateMessageDisappearingSettings";
      id: string;
      result: undefined;
      data: SafeMessageDisappearingSettings & {
        id: string;
      };
    }
  | {
      action: "conversation.removeMessageDisappearingSettings";
      id: string;
      result: undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.isMessageDisappearingEnabled";
      id: string;
      result: boolean;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.stream";
      id: string;
      result: undefined;
      data: {
        groupId: string;
        streamId: string;
      };
    }
  | {
      action: "conversation.pausedForVersion";
      id: string;
      result: string | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.getHmacKeys";
      id: string;
      result: SafeHmacKey[];
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.debugInfo";
      id: string;
      result: SafeConversationDebugInfo;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.consentState";
      id: string;
      result: ConsentState;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.updateConsentState";
      id: string;
      result: undefined;
      data: {
        id: string;
        state: ConsentState;
      };
    }
  /**
   * Group actions
   */
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
    }
  /**
   * DM actions
   */
  | {
      action: "dm.peerInboxId";
      id: string;
      result: string;
      data: {
        id: string;
      };
    }
  | {
      action: "dm.getDuplicateDms";
      id: string;
      result: SafeConversation[];
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
