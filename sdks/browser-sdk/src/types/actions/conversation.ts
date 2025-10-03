import type { ConsentState } from "@xmtp/wasm-bindings";
import type {
  SafeConversation,
  SafeConversationDebugInfo,
  SafeEncodedContent,
  SafeGroupMember,
  SafeHmacKey,
  SafeListMessagesOptions,
  SafeMessage,
  SafeMessageDisappearingSettings,
} from "@/utils/conversions";

export type ConversationAction =
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
      result: Map<string, SafeHmacKey[]>;
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
  | {
      action: "conversation.lastMessage";
      id: string;
      result: SafeMessage | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.isActive";
      id: string;
      result: boolean;
      data: {
        id: string;
      };
    };
