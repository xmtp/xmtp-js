import type {
  ClientOptions,
  EventsClientMessageData,
  EventsClientPostMessageData,
  EventsErrorData,
  EventsResult,
  EventsWorkerMessageData,
  EventsWorkerPostMessageData,
  ListConversationsOptions,
  ListMessagesOptions,
  SendMessageData,
} from "@/types";
import type {
  SafeConversation,
  SafeEncodedContent,
  SafeMessage,
} from "@/utils/conversions";

export type ClientEvents =
  | {
      action: "init";
      id: string;
      result: {
        inboxId: string;
        installationId: string;
      };
      data: {
        address: string;
        options?: ClientOptions;
      };
    }
  | {
      action: "getSignatureText";
      id: string;
      result: string | undefined;
      data: undefined;
    }
  | {
      action: "addSignature";
      id: string;
      result: undefined;
      data: {
        bytes: Uint8Array;
      };
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
        accountAddresses: string[];
      };
    }
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
      action: "getConversations";
      id: string;
      result: SafeConversation[];
      data: {
        options?: ListConversationsOptions;
      };
    }
  | {
      action: "newGroup";
      id: string;
      result: SafeConversation;
      data: {
        accountAddresses: string[];
      };
    }
  | {
      action: "syncGroup";
      id: string;
      result: SafeConversation;
      data: {
        id: string;
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
      action: "updateGroupPinnedFrameUrl";
      id: string;
      result: undefined;
      data: {
        id: string;
        pinnedFrameUrl: string;
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
      action: "getGroupMessages";
      id: string;
      result: SafeMessage[];
      data: {
        id: string;
        options?: ListMessagesOptions;
      };
    }
  | {
      action: "getGroupMembers";
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
        accountAddresses: string[];
      };
    }
  | {
      action: "removeGroupMembers";
      id: string;
      result: undefined;
      data: {
        id: string;
        accountAddresses: string[];
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
      action: "publishGroupMessages";
      id: string;
      result: undefined;
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
