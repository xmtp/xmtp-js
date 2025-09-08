import EventEmitter from "node:events";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import {
  ApiUrls,
  Client,
  LogLevel,
  type ClientOptions,
  type DecodedMessage,
  type XmtpEnv,
} from "@xmtp/node-sdk";
import { isHex } from "viem/utils";
import { getEncryptionKeyFromHex } from "@/utils/crypto.js";
import { logDetails } from "@/utils/debug.js";
import { filter } from "@/utils/filter.js";
import { createSigner, createUser } from "@/utils/user.js";
import { AgentContext } from "./AgentContext.js";

interface EventHandlerMap<ContentTypes> {
  error: [error: Error];
  message: [ctx: AgentContext<ContentTypes>];
  start: [];
  stop: [];
}

export interface AgentOptions<ContentTypes> {
  client: Client<ContentTypes>;
}

export type AgentMessageHandler<ContentTypes = unknown> = (
  ctx: AgentContext<ContentTypes>,
) => Promise<void> | void;

export type AgentMiddleware<ContentTypes = unknown> = (
  ctx: AgentContext<ContentTypes>,
  next: () => Promise<void> | void,
) => Promise<void> | void;

export type AgentErrorMiddleware<ContentTypes = unknown> = (
  error: unknown,
  ctx: AgentContext<ContentTypes> | null,
  next: (err?: unknown) => Promise<void> | void,
) => Promise<void> | void;

export type StreamAllMessagesOptions<ContentTypes> = Parameters<
  Client<ContentTypes>["conversations"]["streamAllMessages"]
>[0];

export interface AgentErrorRegistrar<ContentTypes> {
  use(
    ...errorMiddleware: Array<
      AgentErrorMiddleware<ContentTypes> | AgentErrorMiddleware<ContentTypes>[]
    >
  ): AgentErrorRegistrar<ContentTypes>;
}

export class Agent<ContentTypes> extends EventEmitter<
  EventHandlerMap<ContentTypes>
> {
  #client: Client<ContentTypes>;
  #middleware: AgentMiddleware<ContentTypes>[] = [];
  #errorMiddleware: AgentErrorMiddleware<ContentTypes>[] = [];
  #isListening = false;
  #errors: AgentErrorRegistrar<ContentTypes> = {
    use: (...errorMiddleware) => {
      for (const emw of errorMiddleware) {
        if (Array.isArray(emw)) {
          this.#errorMiddleware.push(...emw);
        } else if (typeof emw === "function") {
          this.#errorMiddleware.push(emw);
        }
      }
      return this.#errors;
    },
  };

  constructor({ client }: AgentOptions<ContentTypes>) {
    super();
    this.#client = client;
  }

  static async create<ContentCodecs extends ContentCodec[] = []>(
    signer?: Parameters<typeof Client.create>[0],
    // Note: we need to omit this so that "Client.create" can correctly infer the codecs.
    options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs },
  ) {
    if (!signer) {
      if (isHex(process.env.XMTP_WALLET_KEY)) {
        signer = createSigner(createUser(process.env.XMTP_WALLET_KEY));
      } else {
        throw new Error(
          `No signer detected. Provide a "signer" to "Agent.create()" or set the "XMTP_WALLET_KEY" environment variable to a private key in hexadecimal format. Read more: https://docs.xmtp.org/inboxes/core-messaging/create-a-signer`,
        );
      }
    }

    const initializedOptions = { ...options };
    initializedOptions.appVersion ??= "agent-sdk/alpha";

    if (process.env.XMTP_DB_ENCRYPTION_KEY) {
      initializedOptions.dbEncryptionKey = getEncryptionKeyFromHex(
        process.env.XMTP_DB_ENCRYPTION_KEY,
      );
    }

    if (
      process.env.XMTP_ENV &&
      Object.keys(ApiUrls).includes(process.env.XMTP_ENV)
    ) {
      initializedOptions.env = process.env.XMTP_ENV as XmtpEnv;
    }

    if (process.env.XMTP_FORCE_DEBUG) {
      initializedOptions.debugEventsEnabled = true;
      initializedOptions.loggingLevel = LogLevel.warn;
      initializedOptions.structuredLogging = true;
    }

    const upgradedCodecs = [
      ...(initializedOptions.codecs ?? []),
      new ReactionCodec(),
      new ReplyCodec(),
      new RemoteAttachmentCodec(),
    ];

    const client = await Client.create(signer, {
      ...initializedOptions,
      codecs: upgradedCodecs,
    });

    if (process.env.XMTP_FORCE_REVOKE_INSTALLATIONS) {
      await client.revokeAllOtherInstallations();
    }

    if (process.env.XMTP_FORCE_DEBUG) {
      await logDetails(client);
    }

    return new Agent({ client });
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

  async start(options?: StreamAllMessagesOptions<ContentTypes>) {
    if (this.#isListening) {
      return;
    }

    try {
      this.#isListening = true;
      void this.emit("start");

      const stream =
        await this.#client.conversations.streamAllMessages(options);
      for await (const message of stream) {
        // The "stop()" method sets "isListening"
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this.#isListening) break;
        try {
          await this.#processMessage(message);
        } catch (error) {
          await this.#runErrorChain(error, null);
        }
      }
    } catch (error) {
      this.#isListening = false;
      await this.#runErrorChain(error, null);
    }
  }

  async #processMessage(message: DecodedMessage<ContentTypes>) {
    let context: AgentContext<ContentTypes> | null = null;
    try {
      const conversation = await this.#client.conversations.getConversationById(
        message.conversationId,
      );

      if (!conversation) {
        throw new Error(
          `Failed to process message ID "${message.id}" for conversation ID "${message.conversationId}" because the conversation could not be found.`,
        );
      }

      context = new AgentContext(message, conversation, this.#client);
      await this.#runMiddlewareChain(context);
    } catch (error) {
      await this.#runErrorChain(error, context);
    }
  }

  async #runMiddlewareChain(context: AgentContext<ContentTypes>) {
    const finalEmit = () => {
      if (filter.notFromSelf(context.message, this.#client)) {
        this.emit("message", context);
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

  async #runErrorChain(
    error: unknown,
    context: AgentContext<ContentTypes> | null,
  ): Promise<boolean> {
    const defaultErrorHandler: AgentErrorMiddleware<ContentTypes> = () => {
      const newError =
        error instanceof Error
          ? error
          : new Error(`Unhandled error caught by default error middleware.`, {
              cause: error,
            });
      void this.emit("error", newError);
    };

    const chain = [...this.#errorMiddleware, defaultErrorHandler];

    let currentError: unknown = error;
    let resumeMain = false as boolean; // whether to continue the normal middleware chain

    // If next(err) gets called, loop continues
    // If next() gets called, resumeMain is true which breaks the error loop
    for (let i = 0; i < chain.length && !resumeMain; ) {
      const errorHandler = chain[i];

      let nextCalled = false as boolean;
      let nextSettled = false;

      const next = (err?: unknown) => {
        if (nextSettled) return;
        nextSettled = true;
        nextCalled = true;

        if (err === undefined) {
          // Recovered
          resumeMain = true;
          return;
        }

        currentError = err;
        i += 1;
      };

      try {
        await errorHandler(currentError, context, next);

        if (!nextCalled) {
          // Treated as handled, stop the error chain here
          break;
        }
      } catch (thrown) {
        // Handler failed while handling the error
        currentError = thrown;
        i += 1;
      }
    }

    return resumeMain;
  }

  get client() {
    return this.#client;
  }

  get errors() {
    return this.#errors;
  }

  stop() {
    this.#isListening = false;
    void this.emit("stop");
  }
}
