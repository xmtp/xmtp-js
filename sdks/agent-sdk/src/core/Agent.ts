import EventEmitter from "node:events";
import fs from "node:fs";
import path from "node:path";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import {
  ApiUrls,
  Client,
  DecodedMessage,
  Dm,
  Group,
  IdentifierKind,
  isActions,
  isAttachment,
  isGroupUpdated,
  isHexString,
  isIntent,
  isLeaveRequest,
  isMarkdown,
  isMultiRemoteAttachment,
  isReaction,
  isReadReceipt,
  isRemoteAttachment,
  isReply,
  isText,
  isTransactionReference,
  isWalletSendCalls,
  LogLevel,
  type Actions,
  type Attachment,
  type ClientOptions,
  type Conversation,
  type CreateDmOptions,
  type CreateGroupOptions,
  type EnrichedReply,
  type GroupUpdated,
  type HexString,
  type Intent,
  type LeaveRequest,
  type MultiRemoteAttachment,
  type Reaction,
  type ReadReceipt,
  type RemoteAttachment,
  type StreamOptions,
  type TransactionReference,
  type WalletSendCalls,
  type XmtpEnv,
} from "@xmtp/node-sdk";
import { version as appVersion } from "~/package.json";
import { filter } from "@/core/filter";
import { getInstallationInfo } from "@/debug";
import { getValidLogLevels, parseLogLevel } from "@/debug/log";
import { createSigner, createUser } from "@/user/User";
import { AgentError, AgentStreamingError } from "./AgentError";
import { ClientContext } from "./ClientContext";
import { ConversationContext } from "./ConversationContext";
import { MessageContext } from "./MessageContext";

type ConversationStream<ContentTypes> = Awaited<
  ReturnType<Client<ContentTypes>["conversations"]["stream"]>
>;

type MessageStream<ContentTypes> = Awaited<
  ReturnType<Client<ContentTypes>["conversations"]["streamAllMessages"]>
>;

type EventHandlerMap<ContentTypes> = {
  actions: [ctx: MessageContext<Actions, ContentTypes>];
  attachment: [ctx: MessageContext<RemoteAttachment, ContentTypes>];
  conversation: [ctx: ConversationContext<ContentTypes>];
  "group-update": [ctx: MessageContext<GroupUpdated, ContentTypes>];
  dm: [ctx: ConversationContext<ContentTypes, Dm<ContentTypes>>];
  group: [ctx: ConversationContext<ContentTypes, Group<ContentTypes>>];
  "inline-attachment": [ctx: MessageContext<Attachment, ContentTypes>];
  intent: [ctx: MessageContext<Intent, ContentTypes>];
  "leave-request": [ctx: MessageContext<LeaveRequest, ContentTypes>];
  markdown: [ctx: MessageContext<string, ContentTypes>];
  message: [ctx: MessageContext<unknown, ContentTypes>];
  "multi-remote-attachment": [
    ctx: MessageContext<MultiRemoteAttachment, ContentTypes>,
  ];
  reaction: [ctx: MessageContext<Reaction, ContentTypes>];
  "read-receipt": [ctx: MessageContext<ReadReceipt, ContentTypes>];
  reply: [ctx: MessageContext<EnrichedReply, ContentTypes>];
  start: [ctx: ClientContext<ContentTypes>];
  stop: [ctx: ClientContext<ContentTypes>];
  text: [ctx: MessageContext<string, ContentTypes>];
  "transaction-reference": [
    ctx: MessageContext<TransactionReference, ContentTypes>,
  ];
  unhandledError: [error: Error];
  unknownMessage: [ctx: MessageContext<unknown, ContentTypes>];
  "wallet-send-calls": [ctx: MessageContext<WalletSendCalls, ContentTypes>];
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
  ctx: MessageContext<unknown, ContentTypes>,
  next: () => Promise<void> | void,
) => Promise<void>;

export type AgentErrorMiddleware<ContentTypes = unknown> = (
  error: unknown,
  ctx: AgentErrorContext<ContentTypes>,
  next: (err?: unknown) => Promise<void> | void,
) => Promise<void> | void;

export type AgentStreamingOptions = Omit<StreamOptions, "onValue" | "onError">;

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
    initializedOptions.appVersion ??= `agent-sdk/${appVersion}`;
    initializedOptions.disableDeviceSync ??= true;

    if (process.env.XMTP_FORCE_DEBUG_LEVEL) {
      const rawLevel = process.env.XMTP_FORCE_DEBUG_LEVEL;
      const logLevel = parseLogLevel(rawLevel);

      if (logLevel) {
        initializedOptions.loggingLevel = logLevel;
      } else {
        console.warn(
          `[WARNING] Invalid XMTP_FORCE_DEBUG_LEVEL "${rawLevel}". Defaulting to "${LogLevel.Warn}". Valid values are: ${getValidLogLevels().join(", ")}`,
        );
        initializedOptions.loggingLevel = LogLevel.Warn;
      }
      initializedOptions.structuredLogging = true;
    }

    const client = await Client.create(signer, {
      ...initializedOptions,
      codecs: initializedOptions.codecs,
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
      XMTP_GATEWAY_HOST,
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

    if (typeof XMTP_GATEWAY_HOST === "string") {
      initializedOptions.gatewayHost = XMTP_GATEWAY_HOST;
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

  get libxmtpVersion() {
    return this.#client.libxmtpVersion;
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

  async start(options?: AgentStreamingOptions) {
    if (this.#isLocked || this.#conversationsStream || this.#messageStream)
      return;

    this.#isLocked = true;

    try {
      this.#conversationsStream = await this.#client.conversations.stream({
        ...options,
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
            new AgentStreamingError(
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
        ...options,
        onValue: async (message) => {
          // this case should not happen,
          // but we must handle it for proper types
          if (!(message instanceof DecodedMessage)) {
            return;
          }
          try {
            switch (true) {
              case isActions(message):
                await this.#processMessage(message, "actions");
                break;
              case isAttachment(message):
                await this.#processMessage(message, "inline-attachment");
                break;
              case isIntent(message):
                await this.#processMessage(message, "intent");
                break;
              case isGroupUpdated(message):
                await this.#processMessage(message, "group-update");
                break;
              case isLeaveRequest(message):
                await this.#processMessage(message, "leave-request");
                break;
              case isMultiRemoteAttachment(message):
                await this.#processMessage(message, "multi-remote-attachment");
                break;
              case isRemoteAttachment(message):
                await this.#processMessage(message, "attachment");
                break;
              case isReaction(message):
                await this.#processMessage(message, "reaction");
                break;
              case isReadReceipt(message):
                await this.#processMessage(message, "read-receipt");
                break;
              case isReply(message):
                await this.#processMessage(message, "reply");
                break;
              case isTransactionReference(message):
                await this.#processMessage(message, "transaction-reference");
                break;
              case isWalletSendCalls(message):
                await this.#processMessage(message, "wallet-send-calls");
                break;
              case isMarkdown(message):
                await this.#processMessage(message, "markdown");
                break;
              case isText(message):
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
            new AgentStreamingError(
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
    context: MessageContext<unknown, ContentTypes>,
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
    return this.#client.conversations.createDmWithIdentifier(
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
    return this.#client.conversations.createGroupWithIdentifiers(
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

  async getConversationContext(conversationId: string) {
    const conversation =
      await this.client.conversations.getConversationById(conversationId);
    if (conversation) {
      const context = new ConversationContext({
        conversation,
        client: this.#client,
      });
      return context;
    }
  }

  get address() {
    return this.#client.accountIdentifier?.identifier;
  }
}
