import EventEmitter from "node:events";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  Client,
  type ClientOptions,
  type DecodedMessage,
} from "@xmtp/node-sdk";
import { filter } from "@/utils/filter";
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
  readonly client: Client<ContentTypes>;
  #middleware: AgentMiddleware<ContentTypes>[] = [];
  #isListening = false;

  constructor(client: Client<ContentTypes>) {
    super();
    this.client = client;
  }

  static async create<ContentCodecs extends ContentCodec[] = []>(
    signer: Parameters<typeof Client.create>[0],
    // Note: we need to omit this so that "Client.create" can correctly infer the codecs.
    options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs },
  ) {
    const client = await Client.create(signer, options);
    return new Agent(client);
  }

  static async build<ContentCodecs extends ContentCodec[] = []>(
    identifier: Parameters<typeof Client.build>[0],
    // Note: we need to omit this so that "Client.build" can correctly infer the codecs.
    options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs },
  ) {
    const client = await Client.build(identifier, options);
    return new Agent(client);
  }

  use(middleware: AgentMiddleware<ContentTypes>) {
    this.#middleware.push(middleware);
    return this;
  }

  async start() {
    if (this.#isListening) {
      return;
    }

    try {
      this.#isListening = true;
      void this.emit("start");

      const stream = await this.client.conversations.streamAllMessages();
      for await (const message of stream) {
        // The "stop()" method sets "isListening"
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this.#isListening) break;
        try {
          await this.processMessage(message);
        } catch (error) {
          this.throwError(error);
        }
      }
    } catch (error) {
      this.#isListening = false;
      this.throwError(error);
    }
  }

  private async processMessage(message: DecodedMessage<ContentTypes>) {
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

    const context = new AgentContext(message, conversation, this.client);

    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < this.#middleware.length) {
        const currentMiddleware = this.#middleware[middlewareIndex++];
        await currentMiddleware(context, next);
      } else if (filter.notFromSelf(message, this.client)) {
        // Note: we are filtering the agent's own message to avoid
        // infinite message loops when a "message" listener replies
        void this.emit("message", context);
      }
    };

    await next();
  }

  stop() {
    this.#isListening = false;
    void this.emit("stop");
  }

  private throwError(error: unknown) {
    const newError = error instanceof Error ? error : new Error(String(error));
    void this.emit("error", newError);
  }
}
