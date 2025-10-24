import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";
import type { GroupUpdatedCodec } from "@xmtp/content-type-group-updated";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import type { TextCodec } from "@xmtp/content-type-text";
import {
  ApiUrls,
  Client,
  Dm,
  Group,
  IdentifierKind,
  isHexString,
  LogLevel,
  type ClientOptions,
  type Conversation,
  type CreateDmOptions,
  type CreateGroupOptions,
  type DecodedMessage,
  type HexString,
  type XmtpEnv,
} from "@xmtp/node-sdk";
import { filter } from "@/core/filter.js";
import { getInstallationInfo } from "@/debug.js";
import { createSigner, createUser } from "@/user/User.js";
import { AgentError } from "./AgentError.js";
import { ClientContext } from "./ClientContext.js";
import { ConversationContext } from "./ConversationContext.js";
import { MessageContext } from "./MessageContext.js";

type ConversationStream<ContentTypes> = Awaited<
  ReturnType<Client<ContentTypes>["conversations"]["stream"]>
>;

type MessageStream<ContentTypes> = Awaited<
  ReturnType<Client<ContentTypes>["conversations"]["streamAllMessages"]>
>;

type EventHandlerMap<ContentTypes> = {
  attachment: [
    ctx: MessageContext<ReturnType<RemoteAttachmentCodec["decode"]>>,
  ];
  conversation: [ctx: ConversationContext<ContentTypes>];
  "group-update": [
    ctx: MessageContext<ReturnType<GroupUpdatedCodec["decode"]>>,
  ];
  dm: [ctx: ConversationContext<ContentTypes, Dm<ContentTypes>>];
  group: [ctx: ConversationContext<ContentTypes, Group<ContentTypes>>];
  message: [ctx: MessageContext<ContentTypes>];
  reaction: [ctx: MessageContext<ReturnType<ReactionCodec["decode"]>>];
  reply: [ctx: MessageContext<ReturnType<ReplyCodec["decode"]>>];
  start: [ctx: ClientContext<ContentTypes>];
  stop: [ctx: ClientContext<ContentTypes>];
  text: [ctx: MessageContext<ReturnType<TextCodec["decode"]>>];
  unhandledError: [error: Error];
  unknownMessage: [ctx: MessageContext<ContentTypes>];
};

type EventName<ContentTypes> = keyof EventHandlerMap<ContentTypes>;

type EthAddress = HexString;

export type AgentBaseContext<ContentTypes = unknown> = {
  client: Client<ContentTypes>;
  conversation: Conversation;
  message: DecodedMessage;
};

export type AgentErrorContext<ContentTypes = unknown> = Partial<
  AgentBaseContext<ContentTypes>
> & {
  client: Client<ContentTypes>;
};

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
  #conversationsStream?: ConversationStream<ContentTypes>;
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
      const loggingLevel = process.env.XMTP_FORCE_DEBUG_LEVEL || LogLevel.warn;
      initializedOptions.debugEventsEnabled = true;
      initializedOptions.loggingLevel = loggingLevel as LogLevel;
      initializedOptions.structuredLogging = true;
    }

    const client = await Client.create(signer, {
      ...initializedOptions,
      codecs: upgradedCodecs,
    });

    const info = await getInstallationInfo(client);
    if (info.totalInstallations > 1 && info.isMostRecent) {
      console.warn(
        `[WARNING] You have "${info.totalInstallations}" installations. Installation ID "${info.installationId}" is the most recent. Make sure to persist and reload your installation data. If you exceed the installation limit, your Agent will stop working. Read more: https://docs.xmtp.org/agents/build-agents/local-database#installation-limits-and-revocation-rules`,
      );
    }

    return new Agent({ client });
  }

  static async createFromEnv<ContentCodecs extends ContentCodec[] = []>(
    // Note: we need to omit this so that "Client.create" can correctly infer the codecs.
    options?: Omit<ClientOptions, "codecs"> & { codecs?: ContentCodecs },
  ) {
    const {
      XMTP_DB_DIRECTORY,
      XMTP_DB_ENCRYPTION_KEY,
      XMTP_ENV,
      XMTP_WALLET_KEY,
    } = process.env;

    if (!isHexString(XMTP_WALLET_KEY)) {
      throw new AgentError(
        1000,
        `XMTP_WALLET_KEY env is not in hex (0x) format.`,
      );
    }

    const signer = createSigner(createUser(XMTP_WALLET_KEY));

    const initializedOptions = { ...(options ?? {}) };

    initializedOptions.dbEncryptionKey =
      typeof XMTP_DB_ENCRYPTION_KEY === "string"
        ? isHexString(XMTP_DB_ENCRYPTION_KEY)
          ? XMTP_DB_ENCRYPTION_KEY
          : `0x${XMTP_DB_ENCRYPTION_KEY}`
        : undefined;

    if (XMTP_ENV && Object.keys(ApiUrls).includes(XMTP_ENV)) {
      initializedOptions.env = XMTP_ENV as XmtpEnv;
    }

    if (typeof XMTP_DB_DIRECTORY === "string") {
      fs.mkdirSync(XMTP_DB_DIRECTORY, { recursive: true, mode: 0o700 });
      initializedOptions.dbPath = (inboxId: string) => {
        const dbPath = path.join(XMTP_DB_DIRECTORY, `xmtp-${inboxId}.db3`);
        console.info(`Saving local database to "${dbPath}"`);
        return dbPath;
      };
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

  async #stopStreams() {
    try {
      await this.#conversationsStream?.end();
    } finally {
      this.#conversationsStream = undefined;
    }

    try {
      await this.#messageStream?.end();
    } finally {
      this.#messageStream = undefined;
    }
  }

  /**
   * Closes all existing streams and restarts the streaming system.
   */
  async #handleStreamError(error: unknown) {
    await this.#stopStreams();

    const recovered = await this.#runErrorChain(error, {
      client: this.#client,
    });

    if (recovered) {
      this.#isLocked = false;
      queueMicrotask(() => this.start());
    }
  }

  async start() {
    if (this.#isLocked || this.#conversationsStream || this.#messageStream)
      return;

    this.#isLocked = true;

    try {
      this.#conversationsStream = await this.#client.conversations.stream({
        onValue: async (conversation) => {
          try {
            if (!conversation) {
              return;
            }
            this.emit(
              "conversation",
              new ConversationContext<ContentTypes, Conversation<ContentTypes>>(
                {
                  conversation,
                  client: this.#client,
                },
              ),
            );
            if (conversation instanceof Group) {
              this.emit(
                "group",
                new ConversationContext<ContentTypes, Group<ContentTypes>>({
                  conversation,
                  client: this.#client,
                }),
              );
            } else if (conversation instanceof Dm) {
              this.emit(
                "dm",
                new ConversationContext<ContentTypes, Dm<ContentTypes>>({
                  conversation,
                  client: this.#client,
                }),
              );
            }
          } catch (error) {
            const recovered = await this.#runErrorChain(
              new AgentError(
                1001,
                "Emitted value from conversation stream caused an error.",
                error,
              ),
              new ClientContext({ client: this.#client }),
            );
            if (!recovered) await this.stop();
          }
        },
        onError: async (error) => {
          const recovered = await this.#runErrorChain(
            new AgentError(
              1002,
              "Error occured during conversation streaming.",
              error,
            ),
            new ClientContext({ client: this.#client }),
          );
          if (!recovered) await this.stop();
        },
      });

      this.#messageStream = await this.#client.conversations.streamAllMessages({
        onValue: async (message) => {
          try {
            switch (true) {
              case filter.isGroupUpdate(message):
                await this.#processMessage(message, "group-update");
                break;
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
          const recovered = await this.#runErrorChain(
            new AgentError(
              1004,
              "Error occured during message streaming.",
              error,
            ),
            new ClientContext({ client: this.#client }),
          );
          if (!recovered) await this.stop();
        },
      });

      this.emit("start", new ClientContext({ client: this.#client }));
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
      const handler = chain[i];
      if (!handler) continue;
      const outcome = await this.#runErrorHandler(
        handler,
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

    await this.#stopStreams();

    this.emit("stop", new ClientContext({ client: this.#client }));

    this.#isLocked = false;
  }

  createDmWithAddress(address: EthAddress, options?: CreateDmOptions) {
    return this.#client.conversations.newDmWithIdentifier(
      {
        identifier: address,
        identifierKind: IdentifierKind.Ethereum,
      },
      options,
    );
  }

  createGroupWithAddresses(
    addresses: EthAddress[],
    options?: CreateGroupOptions,
  ) {
    const identifiers = addresses.map((address) => {
      return {
        identifier: address,
        identifierKind: IdentifierKind.Ethereum,
      };
    });
    return this.#client.conversations.newGroupWithIdentifiers(
      identifiers,
      options,
    );
  }

  addMembersWithAddresses<ContentTypes>(
    group: Group<ContentTypes>,
    addresses: EthAddress[],
  ) {
    const identifiers = addresses.map((address) => {
      return {
        identifier: address,
        identifierKind: IdentifierKind.Ethereum,
      };
    });

    return group.addMembersByIdentifiers(identifiers);
  }

  get address() {
    return this.#client.accountIdentifier?.identifier;
  }
}
