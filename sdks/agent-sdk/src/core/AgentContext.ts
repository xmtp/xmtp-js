import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";

export type AgentBaseContext<ContentTypes = unknown> = {
  client: Client<ContentTypes>;
  conversation: Conversation;
  message: DecodedMessage;
};

export type AgentErrorContext<ContentTypes = unknown> = Partial<
  AgentBaseContext<ContentTypes>
> & {
  client: Client<ContentTypes>;
};
