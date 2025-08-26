import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  Client,
  type ClientOptions,
  type DecodedMessage,
  type Identifier,
  type Signer,
} from "@xmtp/node-sdk";
import { type MessageFilter } from "@/filters/MessageFilters";
import { AgentContext } from "./AgentContext";
import { AgentEventEmitter } from "./AgentEventEmitter";

export type AgentMiddleware<ContentTypes> = (
  ctx: AgentContext<ContentTypes>,
  next: () => Promise<void>,
) => Promise<void>;

type AgentConfig<ContentCodecs extends ContentCodec[] = []> =
  | {
      signer: Signer;
      options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs };
    }
  | {
      identifier: Identifier;
      options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs };
    };

export type MessageHandler = {
  filter?: MessageFilter;
  handler: MessageHandler;
};

/**
 * XMTP Agent for handling messages and events.
 */
export class Agent<ContentTypes> extends AgentEventEmitter<ContentTypes> {
  private client: Client<ContentTypes>;
  private middleware: AgentMiddleware<ContentTypes>[] = [];
  private isListening = false;

  constructor(client: Client<ContentTypes>) {
    super();
    this.client = client;
  }

  static async create<ContentCodecs extends ContentCodec[] = []>(
    config: AgentConfig<ContentCodecs>,
  ) {
    const client =
      "signer" in config
        ? await Client.create(config.signer, config.options)
        : await Client.build(config.identifier, config.options);
    return new Agent(client);
  }

  /**
   * Adds middleware to the agent's processing pipeline.
   *
   * @param middleware - Middleware function to add
   * @returns This agent instance for method chaining
   */
  use(middleware: AgentMiddleware<ContentTypes>) {
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
      void this.emit("start");

      const stream = await this.client.conversations.streamAllMessages();
      for await (const message of stream) {
        // The "stop()" method sets "isListening"
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this.isListening) break;
        try {
          await this.processMessage(message);
        } catch (error: unknown) {
          void this.emit("error", error);
        }
      }
    } catch (error: unknown) {
      this.isListening = false;
      void this.emit("error", error);
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
        void this.emit("message", context);
      }
    };

    await next();
  }

  /**
   * Stops the agent from listening to new messages.
   */
  stop() {
    this.isListening = false;
    void this.emit("stop");
  }
}
