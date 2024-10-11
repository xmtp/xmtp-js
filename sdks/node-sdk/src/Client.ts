import { join } from "node:path";
import process from "node:process";
import type {
  ContentCodec,
  ContentTypeId,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import {
  createClient,
  generateInboxId,
  getInboxIdForAddress,
  NapiGroupMessageKind,
  NapiSignatureRequestType,
  type NapiClient,
  type NapiMessage,
} from "@xmtp/node-bindings";
import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@/codecs/GroupUpdatedCodec";
import { Conversations } from "@/Conversations";

export const ApiUrls = {
  local: "http://localhost:5556",
  dev: "https://grpc.dev.xmtp.network:443",
  production: "https://grpc.production.xmtp.network:443",
} as const;

export type XmtpEnv = keyof typeof ApiUrls;

/**
 * Network options
 */
export type NetworkOptions = {
  /**
   * Specify which XMTP environment to connect to. (default: `dev`)
   */
  env?: XmtpEnv;
  /**
   * apiUrl can be used to override the `env` flag and connect to a
   * specific endpoint
   */
  apiUrl?: string;
};

/**
 * Storage options
 */
export type StorageOptions = {
  /**
   * Encryption key to use for the local DB
   */
  encryptionKey?: Uint8Array | null;
  /**
   * Path to the local DB
   */
  dbPath?: string;
};

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  codecs?: ContentCodec<any>[];
};

export type OtherOptions = {
  /**
   * Optionally set the request history sync URL
   */
  requestHistorySync?: string;
  /**
   * Optionally set the logging level (default: 'off')
   */
  logging?: "debug" | "info" | "warn" | "error" | "off";
};

export type ClientOptions = NetworkOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;

export class Client {
  #innerClient: NapiClient;
  #conversations: Conversations;
  #codecs: Map<string, ContentCodec<any>>;

  constructor(client: NapiClient, codecs: ContentCodec<any>[]) {
    this.#innerClient = client;
    this.#conversations = new Conversations(this, client.conversations());
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  static async create(accountAddress: string, options?: ClientOptions) {
    const host = options?.apiUrl ?? ApiUrls[options?.env ?? "dev"];
    const isSecure = host.startsWith("https");
    const dbPath =
      options?.dbPath ?? join(process.cwd(), `${accountAddress}.db3`);

    const inboxId =
      (await getInboxIdForAddress(host, isSecure, accountAddress)) ||
      generateInboxId(accountAddress);

    return new Client(
      await createClient(
        host,
        isSecure,
        dbPath,
        inboxId,
        accountAddress,
        options?.encryptionKey,
        options?.requestHistorySync,
        options?.logging ?? "off",
      ),
      [new GroupUpdatedCodec(), new TextCodec(), ...(options?.codecs ?? [])],
    );
  }

  get accountAddress() {
    return this.#innerClient.accountAddress;
  }

  get inboxId() {
    return this.#innerClient.inboxId();
  }

  get installationId() {
    return this.#innerClient.installationId();
  }

  get isRegistered() {
    return this.#innerClient.isRegistered();
  }

  async signatureText() {
    try {
      const signatureText = await this.#innerClient.createInboxSignatureText();
      return signatureText;
    } catch (e) {
      return null;
    }
  }

  async canMessage(accountAddresses: string[]) {
    return this.#innerClient.canMessage(accountAddresses);
  }

  addSignature(signatureBytes: Uint8Array) {
    this.#innerClient.addSignature(
      NapiSignatureRequestType.CreateInbox,
      signatureBytes,
    );
  }

  async registerIdentity() {
    return this.#innerClient.registerIdentity();
  }

  get conversations() {
    return this.#conversations;
  }

  codecFor(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString());
  }

  encodeContent(content: any, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }
    const encoded = codec.encode(content, this);
    const fallback = codec.fallback(content);
    if (fallback) {
      encoded.fallback = fallback;
    }
    return encoded;
  }

  decodeContent(message: NapiMessage, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }

    // throw an error if there's an invalid group membership change message
    if (
      contentType.sameAs(ContentTypeGroupUpdated) &&
      message.kind !== NapiGroupMessageKind.MembershipChange
    ) {
      throw new Error("Error decoding group membership change");
    }

    return codec.decode(message.content as EncodedContent, this);
  }

  async requestHistorySync() {
    return this.#innerClient.requestHistorySync();
  }

  async getInboxIdByAddress(accountAddress: string) {
    return this.#innerClient.findInboxIdByAddress(accountAddress);
  }

  async inboxState(refreshFromNetwork: boolean = false) {
    return this.#innerClient.inboxState(refreshFromNetwork);
  }

  async inboxStateFromInboxIds(
    inboxIds: string[],
    refreshFromNetwork?: boolean,
  ) {
    return this.#innerClient.addressesFromInboxId(
      refreshFromNetwork ?? false,
      inboxIds,
    );
  }
}
