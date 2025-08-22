import { EventEmitter } from "node:events";
import { ContentTypeText } from "@xmtp/content-type-text";
import type { Client, Conversation, DecodedMessage } from "@xmtp/node-sdk";
import { filters, type MessageFilter } from "@/filters/MessageFilters";

export type AgentEventHandler = (ctx: AgentContext) => Promise<void> | void;

export type AgentMiddleware = (
  ctx: AgentContext,
  next: () => Promise<void>,
) => Promise<void>;

export interface AgentOptions<Codec> {
  client: Client<Codec>;
}

export interface AgentContext<Codec> {
  client: Client<Codec>;
  conversation: Conversation;
  message: DecodedMessage;
  sendText: (text: string) => Promise<void>;
  getSenderAddress: () => Promise<string>;
}

export type MessageHandler = {
  filter?: MessageFilter;
  handler: AgentEventHandler;
};

export interface Agent<Codec> {
  on(event: "start", listener: () => void): this;
  on(event: "message", handler: AgentEventHandler, filter: MessageFilter): this;
}

export class Agent<Codec> extends EventEmitter {
  private client: Client<Codec>;
  private middleware: AgentMiddleware[] = [];
  private messageHandlers: MessageHandler[] = [];
  private isListening = false;

  /**
   * Creates a new agent instance.
   *
   * @param options - Configuration options including XMTP client
   */
  constructor(options: AgentOptions) {
    super();
    this.client = options.client;
  }

  /**
   * Adds middleware to the agent's processing pipeline.
   *
   * @param middleware - Middleware function to add
   * @returns This agent instance for method chaining
   */
  use(middleware: AgentMiddleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Registers an event handler with optional message filtering.
   *
   * @param event - Event type to listen for
   * @param handler - Handler function to execute
   * @param filter - Optional filter to apply to messages
   * @returns This agent instance for method chaining
   */
  override on(
    event: string,
    handler: AgentEventHandler,
    filter: MessageFilter = filters.notFromSelf,
  ) {
    if (event === "message") {
      this.messageHandlers.push({ filter, handler });
    } else {
      // Event Handler can be asynchronous
      // eslint-disable-next-line
      super.on(event, handler);
    }
    return this;
  }

  /**
   * Starts the agent to begin listening for messages.
   */
  async start() {
    if (this.isListening) {
      return;
    }

    try {
      await this.client.conversations.sync();

      this.isListening = true;
      this.emit("start");

      const stream = await this.client.conversations.streamAllMessages();
      for await (const message of stream) {
        // The "stop()" method sets "isListening"
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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

  /**
   * Processes an incoming message through middleware and handlers.
   *
   * @param message - The decoded message to process
   */
  private async processMessage(message: DecodedMessage) {
    const conversation = await this.client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      return;
    }

    const context = this.createContext(message, conversation);

    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < this.middleware.length) {
        const currentMiddleware = this.middleware[middlewareIndex++];
        await currentMiddleware(context, next);
      } else {
        await this.executeHandlers(context);
      }
    };

    await next();
  }

  /**
   * Executes all registered message handlers for a given context (when their filters pass).
   *
   * @param context - The agent context to process
   */
  private async executeHandlers(context: AgentContext) {
    const { message } = context;
    for (const { filter, handler } of this.messageHandlers) {
      if (!filter || (await filter(message, this.client))) {
        await handler(context);
      }
    }
  }

  /**
   * Creates an agent context from a message and conversation.
   *
   * @param message - The decoded message
   * @param conversation - The conversation object
   * @returns Agent context with helper methods
   */
  private createContext(
    message: DecodedMessage,
    conversation: NonNullable<
      Awaited<ReturnType<typeof this.client.conversations.getConversationById>>
    >,
  ) {
    const context: AgentContext = {
      message,
      conversation,
      client: this.client,
      sendText: async (text: string) => {
        await conversation.send(text, ContentTypeText);
      },
      getSenderAddress: async () => {
        const inboxState = await this.client.preferences.inboxStateFromInboxIds(
          [message.senderInboxId],
        );
        return inboxState[0].identifiers[0].identifier;
      },
    };
    return context;
  }

  /**
   * Stops the agent from listening to new messages.
   */
  stop() {
    this.isListening = false;
    this.emit("stop");
  }

  /**
   * Handles errors by emitting error events.
   *
   * @param error - The error that occurred
   */
  private handleError(error: unknown) {
    this.emit("error", error);
  }
}
