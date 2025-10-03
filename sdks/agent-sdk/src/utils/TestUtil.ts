import type { GroupUpdated } from "@xmtp/content-type-group-updated";
import type { Reaction } from "@xmtp/content-type-reaction";
import type { RemoteAttachment } from "@xmtp/content-type-remote-attachment";
import type { Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import type { Mock } from "vitest";
import { Agent } from "@/core/Agent.js";
import type { DecodedMessageWithContent } from "@/core/filter.js";

export type CurrentClientTypes =
  | string
  | Reaction
  | Reply
  | RemoteAttachment
  | GroupUpdated;

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
  return { agent: new Agent({ client: mockClient }), mockClient };
};

export const mockClient = {
  inboxId: "test-inbox-id",
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
