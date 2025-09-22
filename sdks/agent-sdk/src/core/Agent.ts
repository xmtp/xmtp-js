import EventEmitter from "node:events";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import type { TextCodec } from "@xmtp/content-type-text";
import {
  ApiUrls,
  Client,
  LogLevel,
  type ClientOptions,
  type DecodedMessage,
  type XmtpEnv,
} from "@xmtp/node-sdk";
import { fromString } from "uint8arrays/from-string";
import { isHex } from "viem/utils";
import { AgentError } from "@/utils/error.js";
import { filter } from "@/utils/filter.js";
import { createSigner, createUser } from "@/utils/user.js";
import type { AgentErrorContext } from "./AgentContext.js";
import type { ConversationContext } from "./ConversationContext.js";
import { MessageContext } from "./MessageContext.js";

type MessageStream<ContentTypes> = Awaited<
  ReturnType<Client<ContentTypes>["conversations"]["streamAllMessages"]>
>;

type EventHandlerMap<ContentTypes> = {
  attachment: [
    ctx: MessageContext<ReturnType<RemoteAttachmentCodec["decode"]>>,
  ];
  conversation: [ctx: ConversationContext<ContentTypes>];
  message: [ctx: MessageContext<ContentTypes>];
  reaction: [ctx: MessageContext<ReturnType<ReactionCodec["decode"]>>];
  reply: [ctx: MessageContext<ReturnType<ReplyCodec["decode"]>>];
  start: [];
  stop: [];
  text: [ctx: MessageContext<ReturnType<TextCodec["decode"]>>];
  unhandledError: [error: Error];
  unknownMessage: [ctx: MessageContext<ContentTypes>];
};

type EventName<ContentTypes> = keyof EventHandlerMap<ContentTypes>;

export type AgentOptions<ContentTypes> = {
  client: Client<ContentTypes>;
};

export type AgentMessageHandler<ContentTypes = unknown> = (
  ctx: MessageContext<ContentTypes>,
) => Promise<void> | void;

export type AgentMiddleware<ContentTypes = unknown> = (
  ctx: MessageContext<ContentTypes>,
  next: () => Promise<void> | void,
) => Promise<void>;

export type AgentErrorMiddleware<ContentTypes = unknown> = (
  error: unknown,
  ctx: AgentErrorContext<ContentTypes>,
  next: (err?: unknown) => Promise<void> | void,
) => Promise<void> | void;

export type StreamAllMessagesOptions<ContentTypes> = Parameters<
  Client<ContentTypes>["conversations"]["streamAllMessages"]
>[0];

export type AgentErrorRegistrar<ContentTypes> = {
  use(
    ...errorMiddleware: Array<
      AgentErrorMiddleware<ContentTypes> | AgentErrorMiddleware<ContentTypes>[]
    >
  ): AgentErrorRegistrar<ContentTypes>;
};

type ErrorFlow =
  | { kind: "handled" } // next()
  | { kind: "continue"; error: unknown } // next(err) or handler throws
  | { kind: "stopped" }; // handler returns without next()

export class Agent<ContentTypes = unknown> extends EventEmitter<
  EventHandlerMap<ContentTypes>
> {
  #client: Client<ContentTypes>;
  #messageStream?: MessageStream<ContentTypes>;
  #middleware: AgentMiddleware<ContentTypes>[] = [];
  #errorMiddleware: AgentErrorMiddleware<ContentTypes>[] = [];
  #errors: AgentErrorRegistrar<ContentTypes> = Object.freeze({
    use: (...errorMiddleware: AgentErrorMiddleware<ContentTypes>[]) => {
      for (const emw of errorMiddleware) {
        if (Array.isArray(emw)) {
          this.#errorMiddleware.push(...emw);
        } else if (typeof emw === "function") {
          this.#errorMiddleware.push(emw);
        }
      }
      return this.#errors;
    },
  });
  #defaultErrorHandler: AgentErrorMiddleware<ContentTypes> = (currentError) => {
    const emittedError =
      currentError instanceof Error
        ? currentError
        : new AgentError(
            9999,
            `Unhandled error caught by default error middleware.`,
            currentError,
          );
    this.emit("unhandledError", emittedError);
  };
  #isLocked: boolean = false;

  constructor({ client }: AgentOptions<ContentTypes>) {
    super();
    this.#client = client;
  }

  static async create<ContentCodecs extends ContentCodec[] = []>(
    signer: Parameters<typeof Client.create>[0],
    // Note: we need to omit this so that "Client.create" can correctly infer the codecs.
    options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs },
  ) {
    const initializedOptions = { ...(options ?? {}) };
    initializedOptions.appVersion ??= "agent-sdk/alpha";

    const upgradedCodecs = [
      ...(initializedOptions.codecs ?? []),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
    ];

    if (process.env.XMTP_FORCE_DEBUG) {
      initializedOptions.debugEventsEnabled = true;
      initializedOptions.loggingLevel = LogLevel.warn;
      initializedOptions.structuredLogging = true;
    }

    const client = await Client.create(signer, {
      ...initializedOptions,
      codecs: upgradedCodecs,
    });

    return new Agent({ client });
  }

  static async createFromEnv<ContentCodecs extends ContentCodec[] = []>(
    // Note: we need to omit this so that "Client.create" can correctly infer the codecs.
    options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs },
  ) {
    if (!isHex(process.env.XMTP_WALLET_KEY)) {
      throw new AgentError(
        1000,
        `XMTP_WALLET_KEY env is not in hex (0x) format.`,
      );
    }

    const signer = createSigner(createUser(process.env.XMTP_WALLET_KEY));

    const initializedOptions = { ...(options ?? {}) };

    if (process.env.XMTP_DB_ENCRYPTION_KEY) {
      initializedOptions.dbEncryptionKey = fromString(
        process.env.XMTP_DB_ENCRYPTION_KEY,
        "hex",
      );
    }

    if (
      process.env.XMTP_ENV &&
      Object.keys(ApiUrls).includes(process.env.XMTP_ENV)
    ) {
      initializedOptions.env = process.env.XMTP_ENV as XmtpEnv;
    }

    return this.create(signer, initializedOptions);
  }

  use(
    ...middleware: Array<
      AgentMiddleware<ContentTypes> | AgentMiddleware<ContentTypes>[]
    >
  ): this {
    for (const mw of middleware) {
      if (Array.isArray(mw)) {
        this.#middleware.push(...mw);
      } else if (typeof mw === "function") {
        this.#middleware.push(mw);
      }
    }
    return this;
  }

  async #handleStreamError(error: unknown) {
    this.#messageStream = undefined;
    const recovered = await this.#runErrorChain(error, {
      client: this.#client,
    });
    if (recovered) {
      queueMicrotask(() => this.start());
    }
  }

  async start() {
    if (this.#isLocked || this.#messageStream) return;

    try {
      this.#messageStream = await this.#client.conversations.streamAllMessages({
        onValue: async (message) => {
          try {
            switch (true) {
              case filter.isRemoteAttachment(message):
                await this.#processMessage(message, "attachment");
                break;
              case filter.isReaction(message):
                await this.#processMessage(message, "reaction");
                break;
              case filter.isReply(message):
                await this.#processMessage(message, "reply");
                break;
              case filter.isText(message):
                await this.#processMessage(message, "text");
                break;
              default:
                await this.#processMessage(message);
                break;
            }
          } catch (error) {
            const recovered = await this.#runErrorChain(error, {
              client: this.#client,
            });
            if (!recovered) {
              await this.stop();
            }
            this.#isLocked = false;
          }
        },
        onError: async (error) => {
          await this.#handleStreamError(error);
        },
      });
      this.emit("start");
      this.#isLocked = false;
    } catch (error) {
      await this.#handleStreamError(error);
    }
  }

  async #processMessage(
    message: DecodedMessage<ContentTypes>,
    topic: EventName<ContentTypes> = "unknownMessage",
  ) {
    // Skip messages with undefined content (failed to decode)
    if (!filter.hasContent(message)) {
      return;
    }

    // Skip messages from agent itself
    if (filter.fromSelf(message, this.#client)) {
      return;
    }

    const conversation = await this.#client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      throw new AgentError(
        1003,
        `Failed to process message ID "${message.id}" for conversation ID "${message.conversationId}" because the conversation could not be found.`,
      );
    }

    const context = new MessageContext({
      message,
      conversation,
      client: this.#client,
    });
    await this.#runMiddlewareChain(context, topic);
  }

  async #runMiddlewareChain(
    context: MessageContext<ContentTypes>,
    topic: EventName<ContentTypes> = "unknownMessage",
  ) {
    const finalEmit = async () => {
      try {
        this.emit(topic, context);
        this.emit("message", context);
      } catch (error) {
        await this.#runErrorChain(error, context);
      }
    };

    const chain = this.#middleware.reduceRight<Parameters<AgentMiddleware>[1]>(
      (next, mw) => {
        return async () => {
          try {
            await mw(context, next);
          } catch (error) {
            const resume = await this.#runErrorChain(error, context);
            if (resume) {
              await next();
            }
            // Chain is not resuming, error is being swallowed
          }
        };
      },
      finalEmit,
    );

    await chain();
  }

  async #runErrorHandler(
    handler: AgentErrorMiddleware<ContentTypes>,
    context: AgentErrorContext<ContentTypes>,
    error: unknown,
  ): Promise<ErrorFlow> {
    let settled = false as boolean;
    let flow: ErrorFlow = { kind: "stopped" };

    const next = (nextErr?: unknown) => {
      if (settled) return;
      settled = true;
      flow =
        nextErr === undefined
          ? { kind: "handled" }
          : { kind: "continue", error: nextErr };
    };

    try {
      await handler(error, context, next);
      return flow;
    } catch (thrown) {
      if (settled) {
        return flow;
      }
      return { kind: "continue", error: thrown };
    }
  }

  async #runErrorChain(
    error: unknown,
    context: AgentErrorContext<ContentTypes>,
  ): Promise<boolean> {
    const chain = [...this.#errorMiddleware, this.#defaultErrorHandler];

    let currentError: unknown = error;

    for (let i = 0; i < chain.length; i++) {
      const outcome = await this.#runErrorHandler(
        chain[i],
        context,
        currentError,
      );

      switch (outcome.kind) {
        case "handled":
          // Error was handled. Main middleware can continue.
          return true;
        case "stopped":
          // Error cannot be handled. Main middleware won't continue.
          return false;
        case "continue":
          // Error is passed to the next handler
          currentError = outcome.error;
      }
    }

    // Reached end of chain without recovery
    return false;
  }

  get client() {
    return this.#client;
  }

  get errors() {
    return this.#errors;
  }

  async stop() {
    this.#isLocked = true;
    if (this.#messageStream) {
      await this.#messageStream.end();
      this.#messageStream = undefined;
    }
    this.emit("stop");
    this.#isLocked = false;
  }
}
