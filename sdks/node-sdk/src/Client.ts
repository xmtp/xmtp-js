import { join } from "node:path";
import process from "node:process";
import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
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
  GroupMessageKind,
  Level,
  SignatureRequestType,
  type Consent,
  type ConsentEntityType,
  type LogOptions,
  type Message,
  type Client as NodeClient,
} from "@xmtp/node-bindings";
import { Conversations } from "@/Conversations";
import { isSmartContractSigner, type Signer } from "@/helpers/signer";

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
   * Path to the local DB
   */
  dbPath?: string;
};

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  codecs?: ContentCodec[];
};

export type OtherOptions = {
  /**
   * Optionally set the request history sync URL
   */
  requestHistorySync?: string;
  /**
   * Enable structured JSON logging
   */
  structuredLogging?: boolean;
  /**
   * Logging level
   */
  loggingLevel?: Level;
  /**
   * Disable automatic registration when creating a client
   */
  disableAutoRegister?: boolean;
};

export type ClientOptions = NetworkOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;

export class Client {
  #innerClient: NodeClient;
  #conversations: Conversations;
  #signer: Signer;
  #codecs: Map<string, ContentCodec>;

  constructor(client: NodeClient, signer: Signer, codecs: ContentCodec[]) {
    this.#innerClient = client;
    this.#conversations = new Conversations(this, client.conversations());
    this.#signer = signer;
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  static async create(
    signer: Signer,
    encryptionKey: Uint8Array,
    options?: ClientOptions,
  ) {
    const accountAddress = await signer.getAddress();
    const host = options?.apiUrl ?? ApiUrls[options?.env ?? "dev"];
    const isSecure = host.startsWith("https");
    const dbPath =
      options?.dbPath ??
      join(
        process.cwd(),
        `xmtp-${options?.env ?? "dev"}-${accountAddress}.db3`,
      );

    const inboxId =
      (await getInboxIdForAddress(host, isSecure, accountAddress)) ||
      generateInboxId(accountAddress);

    const logOptions: LogOptions = {
      structured: options?.structuredLogging ?? false,
      level: options?.loggingLevel ?? Level.off,
    };

    const client = new Client(
      await createClient(
        host,
        isSecure,
        dbPath,
        inboxId,
        accountAddress,
        encryptionKey,
        options?.requestHistorySync,
        logOptions,
      ),
      signer,
      [new GroupUpdatedCodec(), new TextCodec(), ...(options?.codecs ?? [])],
    );

    if (!options?.disableAutoRegister) {
      await client.register();
    }

    return client;
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

  async #createInboxSignatureText() {
    try {
      const signatureText = await this.#innerClient.createInboxSignatureText();
      return signatureText;
    } catch {
      return null;
    }
  }

  async #addAccountSignatureText(
    existingAccountAddress: string,
    newAccountAddress: string,
  ) {
    try {
      const signatureText = await this.#innerClient.addWalletSignatureText(
        existingAccountAddress,
        newAccountAddress,
      );
      return signatureText;
    } catch {
      return null;
    }
  }

  async #removeAccountSignatureText(accountAddress: string) {
    try {
      const signatureText =
        await this.#innerClient.revokeWalletSignatureText(accountAddress);
      return signatureText;
    } catch {
      return null;
    }
  }

  async #revokeInstallationsSignatureText() {
    try {
      const signatureText =
        await this.#innerClient.revokeInstallationsSignatureText();
      return signatureText;
    } catch {
      return null;
    }
  }

  async #addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    const signature = await signer.signMessage(signatureText);

    if (isSmartContractSigner(signer)) {
      await this.#innerClient.addScwSignature(
        signatureType,
        signature,
        signer.getChainId(),
        signer.getBlockNumber(),
      );
    } else {
      await this.#innerClient.addSignature(signatureType, signature);
    }
  }

  async #applySignatures() {
    return this.#innerClient.applySignatureRequests();
  }

  async register() {
    const signatureText = await this.#createInboxSignatureText();

    // if the signature text is not available, the client is already registered
    if (!signatureText) {
      return;
    }

    await this.#addSignature(
      SignatureRequestType.CreateInbox,
      signatureText,
      this.#signer,
    );

    return this.#innerClient.registerIdentity();
  }

  async addAccount(newAccountSigner: Signer) {
    const signatureText = await this.#addAccountSignatureText(
      await this.#signer.getAddress(),
      await newAccountSigner.getAddress(),
    );

    if (!signatureText) {
      throw new Error("Unable to generate add account signature text");
    }

    await this.#addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      this.#signer,
    );

    await this.#addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      newAccountSigner,
    );

    await this.#applySignatures();
  }

  async removeAccount(accountAddress: string) {
    const signatureText =
      await this.#removeAccountSignatureText(accountAddress);

    if (!signatureText) {
      throw new Error("Unable to generate remove account signature text");
    }

    await this.#addSignature(
      SignatureRequestType.RevokeWallet,
      signatureText,
      this.#signer,
    );

    await this.#applySignatures();
  }

  async revokeInstallations() {
    const signatureText = await this.#revokeInstallationsSignatureText();

    if (!signatureText) {
      throw new Error("Unable to generate revoke installations signature text");
    }

    await this.#addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.#applySignatures();
  }

  async canMessage(accountAddresses: string[]) {
    const canMessage = await this.#innerClient.canMessage(accountAddresses);
    return new Map(Object.entries(canMessage));
  }

  static async canMessage(accountAddresses: string[], env?: XmtpEnv) {
    const accountAddress = "0x0000000000000000000000000000000000000000";
    const host = ApiUrls[env ?? "dev"];
    const isSecure = host.startsWith("https");
    const dbPath = join(
      process.cwd(),
      `xmtp-${env ?? "dev"}-${accountAddress}.db3`,
    );
    const inboxId =
      (await getInboxIdForAddress(host, isSecure, accountAddress)) ||
      generateInboxId(accountAddress);
    const signer: Signer = {
      getAddress: () => accountAddress,
      signMessage: () => new Uint8Array(),
    };
    const client = new Client(
      await createClient(host, isSecure, dbPath, inboxId, accountAddress),
      signer,
      [],
    );
    return client.canMessage(accountAddresses);
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

  decodeContent(message: Message, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }

    // throw an error if there's an invalid group membership change message
    if (
      contentType.sameAs(ContentTypeGroupUpdated) &&
      message.kind !== GroupMessageKind.MembershipChange
    ) {
      throw new Error("Error decoding group membership change");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return codec.decode(message.content as EncodedContent, this);
  }

  async requestHistorySync() {
    return this.#innerClient.sendHistorySyncRequest();
  }

  async getInboxIdByAddress(accountAddress: string) {
    return this.#innerClient.findInboxIdByAddress(accountAddress);
  }

  async inboxState(refreshFromNetwork: boolean = false) {
    return this.#innerClient.inboxState(refreshFromNetwork);
  }

  async getLatestInboxState(inboxId: string) {
    return this.#innerClient.getLatestInboxState(inboxId);
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

  async setConsentStates(consentStates: Consent[]) {
    return this.#innerClient.setConsentStates(consentStates);
  }

  async getConsentState(entityType: ConsentEntityType, entity: string) {
    return this.#innerClient.getConsentState(entityType, entity);
  }
}
