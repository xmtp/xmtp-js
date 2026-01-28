import type {
  ConsentState,
  ConversationType,
  CreateDmOptions,
  CreateGroupOptions,
  DecodedMessage,
  Identifier,
  ListConversationsOptions,
} from "@xmtp/wasm-bindings";
import type { HmacKeys, SafeConversation } from "@/utils/conversions";

export type ConversationsAction =
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
      result: DecodedMessage | undefined;
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
        options?: ListConversationsOptions;
      };
    }
  | {
      action: "conversations.listGroups";
      id: string;
      result: SafeConversation[];
      data: {
        options?: Omit<ListConversationsOptions, "conversationType">;
      };
    }
  | {
      action: "conversations.listDms";
      id: string;
      result: SafeConversation[];
      data: {
        options?: Omit<ListConversationsOptions, "conversationType">;
      };
    }
  | {
      action: "conversations.createGroupOptimistic";
      id: string;
      result: SafeConversation;
      data: {
        options?: CreateGroupOptions;
      };
    }
  | {
      action: "conversations.createGroupWithIdentifiers";
      id: string;
      result: SafeConversation;
      data: {
        identifiers: Identifier[];
        options?: CreateGroupOptions;
      };
    }
  | {
      action: "conversations.createGroup";
      id: string;
      result: SafeConversation;
      data: {
        inboxIds: string[];
        options?: CreateGroupOptions;
      };
    }
  | {
      action: "conversations.createDmWithIdentifier";
      id: string;
      result: SafeConversation;
      data: {
        identifier: Identifier;
        options?: CreateDmOptions;
      };
    }
  | {
      action: "conversations.createDm";
      id: string;
      result: SafeConversation;
      data: {
        inboxId: string;
        options?: CreateDmOptions;
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
      action: "conversations.hmacKeys";
      id: string;
      result: HmacKeys;
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
  | {
      action: "conversations.streamDeletedMessages";
      id: string;
      result: undefined;
      data: {
        streamId: string;
      };
    };
