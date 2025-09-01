import EventEmitter from "node:events";
import type { ContentCodec } from "@xmtp/content-type-primitives";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { RemoteAttachmentCodec } from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { TextCodec } from "@xmtp/content-type-text";
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
import { isReaction, isText } from "../utils/message.js";
import { AgentContext } from "./AgentContext.js";

interface EventHandlerMap<ContentTypes> {
  error: [error: Error];
  message: [ctx: AgentContext<ContentTypes>];
  reaction: [
    ctx: AgentContext<NonNullable<ReturnType<ReactionCodec["decode"]>>>,
  ];
  text: [ctx: AgentContext<NonNullable<ReturnType<TextCodec["decode"]>>>];
  start: [];
  stop: [];
}

export interface AgentOptions<ContentTypes> {
  client: Client<ContentTypes>;
}

export type AgentEventHandler<ContentTypes = unknown> = (
  ctx: AgentContext<ContentTypes>,
) => Promise<void> | void;

export type AgentMiddleware<ContentTypes> = (
  ctx: AgentContext<ContentTypes>,
  next: () => Promise<void>,
) => Promise<void>;

export class Agent<ContentTypes> extends EventEmitter<
  EventHandlerMap<ContentTypes>
> {
  #client: Client<ContentTypes>;
  #middleware: AgentMiddleware<ContentTypes>[] = [];
  #isListening = false;

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

      const stream = await this.#client.conversations.streamAllMessages();
      for await (const message of stream) {
        // The "stop()" method sets "isListening"
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this.#isListening) break;
        try {
          switch (true) {
            case isReaction(message):
              await this.#processMessage(message, "reaction");
              break;
            case isText(message):
              await this.#processMessage(message, "text");
              break;
            default:
              await this.#processMessage(message);
              break;
          }
        } catch (error) {
          this.#throwError(error);
        }
      }
    } catch (error) {
      this.#isListening = false;
      this.#throwError(error);
    }
  }

  async #processMessage(
    message: DecodedMessage<ContentTypes>,
    topic: keyof EventHandlerMap<ContentTypes> = "message",
  ) {
    const conversation = await this.#client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      this.#throwError(
        new Error(
          `Failed to process message ID "${message.id}" for conversation ID "${message.conversationId}" because the conversation could not be found.`,
        ),
      );
      return;
    }

    const context = new AgentContext({
      message,
      conversation,
      client: this.#client,
    });

    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < this.#middleware.length) {
        const currentMiddleware = this.#middleware[middlewareIndex++];
        await currentMiddleware(context, next);
      } else if (!filter.fromSelf(message, this.#client, conversation)) {
        // Note: we are filtering the agent's own message to avoid
        // infinite message loops when a "message" listener replies
        // Manually invoke listeners so we can surface errors
        const listeners = this.listeners(topic);
        for (const listener of listeners) {
          try {
            listener(context);
          } catch (error) {
            this.#throwError(error);
          }
        }
      }
    };

    await next();
  }

  get client() {
    return this.#client;
  }

  stop() {
    this.#isListening = false;
    void this.emit("stop");
  }

  #throwError(error: unknown) {
    const newError = error instanceof Error ? error : new Error(String(error));
    void this.emit("error", newError);
  }
}
