import EventEmitter from "node:events";
import { ContentCodec } from "@xmtp/content-type-primitives";
import { ReplyCodec } from "@xmtp/content-type-reply";
import {
  Client,
  ClientOptions,
  DecodedMessage,
  Identifier,
  Signer,
} from "@xmtp/node-sdk";
import { filters, type MessageFilter } from "@/filters";
import { createSigner, createUser } from "@/utils/user";
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

// TODO: Check if we can infer that from "Client"
type AgentConfig<ContentCodecs extends ContentCodec[] = []> =
  | {
      signer: Signer;
      options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs };
    }
  | {
      identifier: Identifier;
      options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs };
    };

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

  // TODO: Separate into "create" and "build"
  static async create<ContentCodecs extends ContentCodec[] = []>(
    config: AgentConfig<ContentCodecs>,
  ) {
    const client =
      "signer" in config
        ? await Client.create(config.signer, config.options)
        : await Client.build(config.identifier, config.options);
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
        await currentMiddleware(context, next);
      } else {
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

const user = createUser();
const signer = createSigner(user);
const client = await Client.create(signer, {
  env: "dev",
  codecs: [new ReplyCodec()],
});

const agent = new Agent(client);

agent.on("message", async (ctx) => {
  ctx.conversation.send("Hello!");
});

const errorHandler = (error: Error) => {
  console.log(`Caught error: ${error.message}`);
};

agent.on("error", errorHandler);

agent.off("error", errorHandler);

export const withFilter =
  <C>(filter: MessageFilter<C>, listener: (ctx: AgentContext<C>) => void) =>
  (ctx: AgentContext<C>) => {
    if (filter(ctx.message, ctx.client)) {
      listener(ctx);
    }
  };

agent.on(
  "message",
  withFilter(filters.and(filters.notFromSelf, filters.textOnly), (ctx) => {
    console.log("Text not from us", ctx.message.content);
  }),
);

const filter = filters.and(filters.notFromSelf, filters.textOnly);
agent.on(
  "message",
  withFilter(filter, async (ctx) => {
    await ctx.conversation.send("Hey!");
  }),
);
