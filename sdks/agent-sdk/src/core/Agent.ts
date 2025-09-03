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

export type AgentMiddleware<ContentTypes> = (
  ctx: AgentContext<ContentTypes>,
  next: () => Promise<void>,
) => Promise<void> | void;

export type AgentErrorMiddleware<ContentTypes> = (
  error: unknown,
  ctx: AgentContext<ContentTypes> | null,
  next: (err?: unknown) => Promise<void>,
) => Promise<void>;

export type StreamAllMessagesOptions<ContentTypes> = Parameters<
  Client<ContentTypes>["conversations"]["streamAllMessages"]
>[0];

export interface AgentErrorRegistrar<ContentTypes> {
  /**
   * Register one or more error middleware functions. Accepts variadic args and/or arrays.
   * Returns itself for chaining: agent.errors.use(fn1).use(fn2)
   */
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
  public readonly errors: AgentErrorRegistrar<ContentTypes>;

  constructor({ client }: AgentOptions<ContentTypes>) {
    super();
    this.#client = client;
    // Initialize errors registrar
    this.errors = {
      use: (
        ...errorMiddleware: Array<
          | AgentErrorMiddleware<ContentTypes>
          | AgentErrorMiddleware<ContentTypes>[]
        >
      ) => {
        for (const emw of errorMiddleware) {
          if (Array.isArray(emw)) {
            this.#errorMiddleware.push(...emw);
          } else if (typeof emw === "function") {
            this.#errorMiddleware.push(emw);
          }
        }
        return this.errors;
      },
    };
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
          this.#defaultErrorHandler(error);
        }
      }
    } catch (error) {
      this.#isListening = false;
      this.#defaultErrorHandler(error);
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
    const dispatch = async (index: number): Promise<void> => {
      if (index >= this.#middleware.length) {
        if (filter.notFromSelf(context.message, this.#client)) {
          void this.emit("message", context);
        }
        return;
      }

      const currentMiddleware = this.#middleware[index];
      try {
        await currentMiddleware(context, async () => {
          await dispatch(index + 1);
        });
      } catch (error) {
        // Run error chain; if it signals resume, continue with next normal middleware.
        const resume = await this.#runErrorChain(error, context);
        if (resume) {
          await dispatch(index + 1);
        }
      }
    };

    await dispatch(0);
  }

  async #runErrorChain(
    error: unknown,
    context: AgentContext<ContentTypes> | null,
  ): Promise<boolean> {
    if (this.#errorMiddleware.length === 0) {
      this.#defaultErrorHandler(error);
      return false;
    }

    let index = 0;
    let currentError = error;
    let resume = false; // whether to continue normal middleware chain
    let propagate = true; // whether unhandled error should reach default handler

    const runCurrent = async (): Promise<void> => {
      if (resume || index >= this.#errorMiddleware.length) {
        return;
      }

      const errorHandler = this.#errorMiddleware[index];
      let nextCalled = false;
      const nextError = async (err?: unknown) => {
        nextCalled = true;
        if (err === undefined) {
          // Recover
          resume = true;
          propagate = false;
          return;
        } else {
          currentError = err;
          index += 1;
          await runCurrent();
        }
      };

      try {
        await errorHandler(currentError, context, nextError);
        if (!nextCalled) {
          // Treated as handled; stop chain
          propagate = false;
        }
      } catch (thrown) {
        currentError = thrown;
        index += 1;
        await runCurrent();
      }
    };

    await runCurrent();

    if (propagate && !resume) {
      this.#defaultErrorHandler(currentError);
    }

    return resume;
  }

  get client() {
    return this.#client;
  }

  stop() {
    this.#isListening = false;
    void this.emit("stop");
  }

  #defaultErrorHandler(error: unknown) {
    const newError = error instanceof Error ? error : new Error(String(error));
    void this.emit("error", newError);
  }
}
