import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import type { Reaction } from "@xmtp/content-type-reaction";
import type { ReadReceipt } from "@xmtp/content-type-read-receipt";
import {
  AttachmentCodec,
  type RemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import type { Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { TransactionReference } from "@xmtp/content-type-transaction-reference";
import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import type { Mock } from "vitest";
import { Agent } from "@/core/Agent.js";
import type { DecodedMessageWithContent } from "@/core/filter.js";
import type { MessageContext } from "@/core/MessageContext.js";

export type CurrentClientTypes =
  | GroupUpdated
  | Reaction
  | ReadReceipt
  | RemoteAttachment
  | Reply
  | string
  | TransactionReference
  | WalletSendCallsParams;

export const createMockMessage = <ContentType>(
  overrides: Partial<DecodedMessage> & { content: ContentType },
): DecodedMessageWithContent<ContentType> => {
  const { content, ...rest } = overrides;
  return {
    id: "mock-message-id",
    conversationId: "test-conversation-id",
    senderInboxId: "sender-inbox-id",
    contentType: ContentTypeText,
    ...rest,
    content,
  } as DecodedMessageWithContent<ContentType>;
};

export const makeAgent = () => {
  const mockClient = makeClient();
  return { agent: new Agent({ client: mockClient }), mockClient };
};

export const makeClient = () => {
  const attachmentCodec = new AttachmentCodec();
  return {
    inboxId: "test-inbox-id",
    codecFor: (contentType: ContentTypeId) => {
      if (contentType.sameAs(attachmentCodec.contentType)) {
        return attachmentCodec;
      }
    },
    conversations: {
      sync: vi.fn().mockResolvedValue(undefined),
      stream: vi.fn().mockResolvedValue(undefined),
      streamAllMessages: vi.fn(),
      getConversationById: vi.fn().mockResolvedValue({
        send: vi.fn().mockResolvedValue(undefined),
      }),
    },
    preferences: {
      inboxStateFromInboxIds: vi.fn(),
    },
  } as unknown as Client & {
    conversations: {
      stream: Mock;
      streamAllMessages: Mock;
    };
  };
};

export const createMockStreamWithCallbacks = (messages: DecodedMessage[]) => {
  const mockStream = {
    end: vi.fn().mockResolvedValue(undefined),
    [Symbol.asyncIterator]: vi.fn(),
  };

  return vi
    .fn()
    .mockImplementation(
      (options: { onValue: (value: DecodedMessage) => void }) => {
        // Simulate async message delivery
        queueMicrotask(() => {
          messages.forEach((message) => {
            options.onValue(message);
          });
        });
        return Promise.resolve(mockStream);
      },
    );
};

export const createMockConversationStreamWithCallbacks = (
  conversations: Conversation[],
) => {
  const mockStream = {
    end: vi.fn().mockResolvedValue(undefined),
    [Symbol.asyncIterator]: vi.fn(),
  };

  return vi
    .fn()
    .mockImplementation(
      (options: { onValue: (value: Conversation) => void }) => {
        // Simulate async conversation delivery
        queueMicrotask(() => {
          conversations.forEach((conversation) => {
            options.onValue(conversation);
          });
        });
        return Promise.resolve(mockStream);
      },
    );
};

export const flushMicrotasks = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

export const expectMessage = (decodedMessage: object) => {
  return {
    message: expect.objectContaining(decodedMessage) as DecodedMessage,
  } as MessageContext;
};
