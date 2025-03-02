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
  isAddressAuthorized as isAddressAuthorizedBinding,
  isInstallationAuthorized as isInstallationAuthorizedBinding,
  LogLevel,
  SignatureRequestType,
  verifySignedWithPublicKey as verifySignedWithPublicKeyBinding,
  type Consent,
  type ConsentEntityType,
  type LogOptions,
  type Message,
  type Client as NodeClient,
} from "@xmtp/node-bindings";
import { Conversations } from "@/Conversations";
import { type Signer } from "@/helpers/signer";
import { version } from "@/helpers/version";

export const ApiUrls = {
  local: "http://localhost:5556",
  dev: "https://grpc.dev.xmtp.network:443",
  production: "https://grpc.production.xmtp.network:443",
} as const;

export const HistorySyncUrls = {
  local: "http://localhost:5558",
  dev: "https://message-history.dev.ephemera.network",
  production: "https://message-history.production.ephemera.network",
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
  /**
   * historySyncUrl can be used to override the `env` flag and connect to a
   * specific endpoint for syncing history
   */
  historySyncUrl?: string;
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
   * Enable structured JSON logging
   */
  structuredLogging?: boolean;
  /**
   * Logging level
   */
  loggingLevel?: LogLevel;
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
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    const isSecure = host.startsWith("https");
    const dbPath =
      options?.dbPath ||
      join(
        process.cwd(),
        `xmtp-${options?.env || "dev"}-${accountAddress}.db3`,
      );

    const inboxId =
      (await getInboxIdForAddress(host, isSecure, accountAddress)) ||
      generateInboxId(accountAddress);

    const logOptions: LogOptions = {
      structured: options?.structuredLogging ?? false,
      level: options?.loggingLevel ?? LogLevel.off,
    };

    const historySyncUrl =
      options?.historySyncUrl || HistorySyncUrls[options?.env || "dev"];

    const client = new Client(
      await createClient(
        host,
        isSecure,
        dbPath,
        inboxId,
        accountAddress,
        encryptionKey,
        historySyncUrl,
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

  get installationIdBytes() {
    return this.#innerClient.installationIdBytes();
  }

  get isRegistered() {
    return this.#innerClient.isRegistered();
  }

  async createInboxSignatureText() {
    try {
      const signatureText = await this.#innerClient.createInboxSignatureText();
      return signatureText;
    } catch {
      return undefined;
    }
  }

  async addAccountSignatureText(newAccountAddress: string) {
    try {
      const signatureText =
        await this.#innerClient.addWalletSignatureText(newAccountAddress);
      return signatureText;
    } catch {
      return undefined;
    }
  }

  async removeAccountSignatureText(accountAddress: string) {
    try {
      const signatureText =
        await this.#innerClient.revokeWalletSignatureText(accountAddress);
      return signatureText;
    } catch {
      return undefined;
    }
  }

  async revokeAllOtherInstallationsSignatureText() {
    try {
      const signatureText =
        await this.#innerClient.revokeAllOtherInstallationsSignatureText();
      return signatureText;
    } catch {
      return undefined;
    }
  }

  async revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    try {
      const signatureText =
        await this.#innerClient.revokeInstallationsSignatureText(
          installationIds,
        );
      return signatureText;
    } catch {
      return undefined;
    }
  }

  async addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    const signature = await signer.signMessage(signatureText);

    if (signer.walletType === "SCW") {
      await this.#innerClient.addScwSignature(
        signatureType,
        signature,
        signer.getChainId(),
        signer.getBlockNumber?.(),
      );
    } else {
      await this.#innerClient.addSignature(signatureType, signature);
    }
  }

  async applySignatures() {
    return this.#innerClient.applySignatureRequests();
  }

  async register() {
    const signatureText = await this.createInboxSignatureText();

    // if the signature text is not available, the client is already registered
    if (!signatureText) {
      return;
    }

    await this.addSignature(
      SignatureRequestType.CreateInbox,
      signatureText,
      this.#signer,
    );

    return this.#innerClient.registerIdentity();
  }

  async addAccount(newAccountSigner: Signer) {
    const signatureText = await this.addAccountSignatureText(
      await newAccountSigner.getAddress(),
    );

    if (!signatureText) {
      throw new Error("Unable to generate add account signature text");
    }

    await this.addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      newAccountSigner,
    );

    await this.applySignatures();
  }

  async removeAccount(accountAddress: string) {
    const signatureText = await this.removeAccountSignatureText(accountAddress);

    if (!signatureText) {
      throw new Error("Unable to generate remove account signature text");
    }

    await this.addSignature(
      SignatureRequestType.RevokeWallet,
      signatureText,
      this.#signer,
    );

    await this.applySignatures();
  }

  async revokeAllOtherInstallations() {
    const signatureText = await this.revokeAllOtherInstallationsSignatureText();

    if (!signatureText) {
      throw new Error(
        "Unable to generate revoke all other installations signature text",
      );
    }

    await this.addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.applySignatures();
  }

  async revokeInstallations(installationIds: Uint8Array[]) {
    const signatureText =
      await this.revokeInstallationsSignatureText(installationIds);

    if (!signatureText) {
      throw new Error("Unable to generate revoke installations signature text");
    }

    await this.addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.applySignatures();
  }

  async canMessage(accountAddresses: string[]) {
    const canMessage = await this.#innerClient.canMessage(accountAddresses);
    return new Map(Object.entries(canMessage));
  }

  static async canMessage(accountAddresses: string[], env?: XmtpEnv) {
    const accountAddress = "0x0000000000000000000000000000000000000000";
    const host = ApiUrls[env || "dev"];
    const isSecure = host.startsWith("https");
    const inboxId =
      (await getInboxIdForAddress(host, isSecure, accountAddress)) ||
      generateInboxId(accountAddress);
    const signer: Signer = {
      walletType: "EOA",
      getAddress: () => accountAddress,
      signMessage: () => new Uint8Array(),
    };
    const client = new Client(
      await createClient(host, isSecure, undefined, inboxId, accountAddress),
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

  signWithInstallationKey(signatureText: string) {
    return this.#innerClient.signWithInstallationKey(signatureText);
  }

  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    try {
      this.#innerClient.verifySignedWithInstallationKey(
        signatureText,
        signatureBytes,
      );
      return true;
    } catch {
      return false;
    }
  }

  static verifySignedWithPublicKey(
    signatureText: string,
    signatureBytes: Uint8Array,
    publicKey: Uint8Array,
  ) {
    try {
      verifySignedWithPublicKeyBinding(
        signatureText,
        signatureBytes,
        publicKey,
      );
      return true;
    } catch {
      return false;
    }
  }

  static async isAddressAuthorized(
    inboxId: string,
    address: string,
    options?: NetworkOptions,
  ): Promise<boolean> {
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    return await isAddressAuthorizedBinding(host, inboxId, address);
  }

  static async isInstallationAuthorized(
    inboxId: string,
    installation: Uint8Array,
    options?: NetworkOptions,
  ): Promise<boolean> {
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    return await isInstallationAuthorizedBinding(host, inboxId, installation);
  }

  static get version() {
    return version;
  }
}
