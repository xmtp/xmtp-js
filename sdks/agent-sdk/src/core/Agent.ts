import EventEmitter from "node:events";
import { Client, type DecodedMessage } from "@xmtp/node-sdk";
import { AgentContext } from "./AgentContext";

interface EventHandlerMap<ContentTypes> {
  error: [error: Error];
  message: [ctx: AgentContext<ContentTypes>];
  start: [];
  stop: [];
}

export type AgentMiddleware<ContentTypes> = (
  ctx: AgentContext<ContentTypes>,
  next: () => Promise<void>,
) => Promise<void>;

export class Agent<ContentTypes> extends EventEmitter<
  EventHandlerMap<ContentTypes>
> {
  private client: Client<ContentTypes>;
  private middleware: AgentMiddleware<ContentTypes>[] = [];
  private isListening = false;

  constructor(client: Client<ContentTypes>) {
    super();
    this.client = client;
  }

  static async create(
    signer: Parameters<typeof Client.create>[0],
    options?: Parameters<typeof Client.create>[1],
  ) {
    const client = await Client.create(signer, options);
    return new Agent(client);
  }

  static async build(
    identifier: Parameters<typeof Client.build>[0],
    options?: Parameters<typeof Client.build>[1],
  ) {
    const client = await Client.build(identifier, options);
    return new Agent(client);
  }

  use(middleware: AgentMiddleware<ContentTypes>) {
    this.middleware.push(middleware);
    return this;
  }

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
        } catch (error) {
          this.throwError(error);
        }
      }
    } catch (error) {
      this.isListening = false;
      this.throwError(error);
    }
  }

  private async processMessage(message: DecodedMessage) {
    const conversation = await this.client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      this.throwError(
        new Error(
          `Failed to process message ID "${message.id}" for conversation ID "${message.conversationId}" because the conversation could not be found.`,
        ),
      );
      return;
    }

    const context: AgentContext<any> = new AgentContext(
      message,
      conversation,
      this.client,
    );

    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < this.middleware.length) {
        const currentMiddleware = this.middleware[middlewareIndex++];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await currentMiddleware(context, next);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        void this.emit("message", context);
      }
    };

    await next();
  }

  stop() {
    this.isListening = false;
    void this.emit("stop");
  }

  private throwError(error: unknown) {
    const newError = error instanceof Error ? error : new Error(String(error));
    void this.emit("error", newError);
  }
}
