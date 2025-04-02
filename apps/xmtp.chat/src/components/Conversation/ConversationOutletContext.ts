import type { Client, Conversation } from "@xmtp/browser-sdk";

export type ConversationOutletContext = {
  conversation: Conversation;
  client: Client;
};
