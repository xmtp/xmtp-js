import { EventEmitter } from "node:events";
import { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { filters, type MessageFilter } from "../filters/MessageFilters";

export type AgentEventHandler = (ctx: AgentContext) => Promise<void> | void;

export type AgentMiddleware = (
  ctx: AgentContext,
  next: () => Promise<void>,
) => Promise<void>;

export interface AgentOptions {
  client: Client;
}

type Identifier = string;

export interface AgentContext {
  client: Client;
  conversation: Conversation;
  message: DecodedMessage;
  send: (text: string) => Promise<void>;
  getSenderAddress: () => Promise<Identifier>;
}

export type MessageHandler = {
  filter?: MessageFilter;
  handler: AgentEventHandler;
};

export class Agent extends EventEmitter {
  private client: Client;
  private middleware: AgentMiddleware[] = [];
  private messageHandlers: MessageHandler[] = [];
  private isListening = false;

  constructor(options: AgentOptions) {
    super();
    this.client = options.client;
  }

  use(middleware: AgentMiddleware) {
    this.middleware.push(middleware);
    return this;
  }

  override on(
    event: string,
    handler: AgentEventHandler,
    filter: MessageFilter = filters.notFromSelf,
  ): this {
    if (event === "message") {
      this.messageHandlers.push({ filter, handler });
    } else {
      super.on(event, handler);
    }
    return this;
  }

  async start() {
    if (this.isListening) {
      console.warn("Agent is already listening");
      return;
    }

    try {
      console.log("Syncing conversations...");
      await this.client.conversations.sync();

      this.isListening = true;
      this.emit("start");

      console.log("Waiting for messages...");
      const stream = await this.client.conversations.streamAllMessages();
      for await (const message of stream) {
        if (!this.isListening) break;
        try {
          await this.processMessage(message);
        } catch (error: unknown) {
          this.handleError(error);
        }
      }
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  private async processMessage(message: DecodedMessage) {
    const conversation = await this.client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      console.log(
        `Unable to find conversation ID "${message.conversationId}", skipping message...`,
      );
      return;
    }

    // Create message context
    const ctx = await this.createContext(message, conversation);

    // Process middleware
    let index = 0;
    const next = async () => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++];
        await middleware(ctx, next);
      } else {
        await this.executeHandlers(ctx);
      }
    };

    await next();
  }

  private async executeHandlers(ctx: AgentContext) {
    const { message } = ctx;
    const messageHandlers = this.messageHandlers;
    for (const { filter, handler } of messageHandlers) {
      if (!filter || (await filter(message, this.client))) {
        await handler(ctx);
      }
    }
  }

  private async createContext(
    message: DecodedMessage,
    conversation: NonNullable<
      Awaited<ReturnType<typeof this.client.conversations.getConversationById>>
    >,
  ) {
    const ctx: AgentContext = {
      message,
      conversation,
      client: this.client,
      send: async (text: string) => {
        await conversation.send(text);
      },
      getSenderAddress: async () => {
        const inboxState = await this.client.preferences.inboxStateFromInboxIds(
          [message.senderInboxId],
        );
        return inboxState[0].identifiers[0].identifier;
      },
    };
    return ctx;
  }

  stop() {
    console.log("🛑 Stopping agent...");
    this.isListening = false;
    this.emit("stop");
  }

  private handleError(error: unknown) {
    console.error("Agent error", error);
    this.emit("error", error);
  }
}
