import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";

export interface AgentBaseContext<ContentTypes = unknown> {
  client: Client<ContentTypes>;
  conversation: Conversation;
  message: DecodedMessage;
}

export interface AgentErrorContext<ContentTypes = unknown>
  extends Partial<AgentBaseContext<ContentTypes>> {
  client: Client<ContentTypes>;
}
