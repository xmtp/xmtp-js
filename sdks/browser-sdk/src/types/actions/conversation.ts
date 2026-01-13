import type {
  Actions,
  Attachment,
  ConsentState,
  ConversationDebugInfo,
  DecodedMessage,
  EncodedContent,
  GroupMember,
  Intent,
  ListMessagesOptions,
  MessageDisappearingSettings,
  MultiRemoteAttachment,
  Reaction,
  RemoteAttachment,
  Reply,
  SendMessageOpts,
  TransactionReference,
  WalletSendCalls,
} from "@xmtp/wasm-bindings";
import type {
  HmacKeys,
  LastReadTimes,
  SafeConversation,
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
        content: EncodedContent;
        options?: SendMessageOpts;
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
      result: DecodedMessage[];
      data: {
        id: string;
        options?: ListMessagesOptions;
      };
    }
  | {
      action: "conversation.countMessages";
      id: string;
      result: bigint;
      data: {
        id: string;
        options?: Omit<ListMessagesOptions, "limit" | "direction">;
      };
    }
  | {
      action: "conversation.members";
      id: string;
      result: GroupMember[];
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.messageDisappearingSettings";
      id: string;
      result: MessageDisappearingSettings | undefined;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.updateMessageDisappearingSettings";
      id: string;
      result: undefined;
      data: MessageDisappearingSettings & {
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
      action: "conversation.hmacKeys";
      id: string;
      result: HmacKeys;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.debugInfo";
      id: string;
      result: ConversationDebugInfo;
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
      result: DecodedMessage | undefined;
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
    }
  | {
      action: "conversation.lastReadTimes";
      id: string;
      result: LastReadTimes;
      data: {
        id: string;
      };
    }
  | {
      action: "conversation.sendText";
      id: string;
      result: string;
      data: {
        id: string;
        text: string;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendMarkdown";
      id: string;
      result: string;
      data: {
        id: string;
        markdown: string;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendReaction";
      id: string;
      result: string;
      data: {
        id: string;
        reaction: Reaction;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendReadReceipt";
      id: string;
      result: string;
      data: {
        id: string;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendReply";
      id: string;
      result: string;
      data: {
        id: string;
        reply: Reply;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendTransactionReference";
      id: string;
      result: string;
      data: {
        id: string;
        transactionReference: TransactionReference;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendWalletSendCalls";
      id: string;
      result: string;
      data: {
        id: string;
        walletSendCalls: WalletSendCalls;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendActions";
      id: string;
      result: string;
      data: {
        id: string;
        actions: Actions;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendIntent";
      id: string;
      result: string;
      data: {
        id: string;
        intent: Intent;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendAttachment";
      id: string;
      result: string;
      data: {
        id: string;
        attachment: Attachment;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendMultiRemoteAttachment";
      id: string;
      result: string;
      data: {
        id: string;
        multiRemoteAttachment: MultiRemoteAttachment;
        isOptimistic?: boolean;
      };
    }
  | {
      action: "conversation.sendRemoteAttachment";
      id: string;
      result: string;
      data: {
        id: string;
        remoteAttachment: RemoteAttachment;
        isOptimistic?: boolean;
      };
    };
