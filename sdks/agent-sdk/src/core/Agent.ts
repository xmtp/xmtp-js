import type { Client, DecodedMessage } from "@xmtp/node-sdk";
import { type MessageFilter } from "@/filters/MessageFilters";
import { AgentContext } from "./AgentContext";
import { AgentEventEmitter, AgentEventHandler } from "./AgentEventEmitter";

export type AgentMiddleware = (
  ctx: AgentContext,
  next: () => Promise<void>,
) => Promise<void>;

export interface AgentConfig {
  client: Client;
}

export type MessageHandler = {
  filter?: MessageFilter;
  handler: AgentEventHandler;
};

/**
 * XMTP Agent for handling messages and events.
 */
export class Agent extends AgentEventEmitter {
  private client: Client;
  private middleware: AgentMiddleware[] = [];
  private isListening = false;

  /**
   * Creates a new agent instance.
   *
   * @param options - Configuration options including XMTP client
   */
  constructor(options: AgentConfig) {
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
   * Starts the agent to begin listening for messages.
   */
  async start() {
    if (this.isListening) {
      return;
    }

    try {
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
          this.emit("error", error);
        }
      }
    } catch (error: unknown) {
      this.emit("error", error);
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

    const context = new AgentContext(message, conversation, this.client);

    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < this.middleware.length) {
        const currentMiddleware = this.middleware[middlewareIndex++];
        await currentMiddleware(context, next);
      } else {
        await this.emit("message", context);
      }
    };

    await next();
  }

  /**
   * Stops the agent from listening to new messages.
   */
  stop() {
    this.isListening = false;
    this.emit("stop");
  }
}
