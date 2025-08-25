import { ContentTypeText } from "@xmtp/content-type-text";
import { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";

export class AgentContext {
  public readonly client: Client;
  public readonly conversation: Conversation;
  public readonly message: DecodedMessage;

  constructor(
    message: DecodedMessage,
    conversation: Conversation,
    client: Client,
  ) {
    this.message = message;
    this.conversation = conversation;
    this.client = client;
  }

  async sendText(text: string): Promise<void> {
    await this.conversation.send(text, ContentTypeText);
  }

  async getSenderAddress(): Promise<string> {
    const inboxState = await this.client.preferences.inboxStateFromInboxIds([
      this.message.senderInboxId,
    ]);
    return inboxState[0].identifiers[0].identifier;
  }
}
