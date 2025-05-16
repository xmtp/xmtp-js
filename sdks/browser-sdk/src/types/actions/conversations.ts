import type {
  ConsentState,
  ConversationType,
  Identifier,
} from "@xmtp/wasm-bindings";
import type {
  SafeConversation,
  SafeCreateDmOptions,
  SafeCreateGroupOptions,
  SafeHmacKeys,
  SafeListConversationsOptions,
  SafeMessage,
} from "@/utils/conversions";

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
    };
