import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import { GroupMessageKind, type Identifier } from "@xmtp/wasm-bindings";
import { v4 } from "uuid";
import { ClientWorkerClass } from "@/ClientWorkerClass";
import { Conversations } from "@/Conversations";
import { DebugInformation } from "@/DebugInformation";
import { Preferences } from "@/Preferences";
import type { ClientOptions, XmtpEnv } from "@/types/options";
import { Utils } from "@/Utils";
import {
  fromSafeEncodedContent,
  toSafeEncodedContent,
  type SafeMessage,
} from "@/utils/conversions";
import {
  AccountAlreadyAssociatedError,
  CodecNotFoundError,
  InboxReassignError,
  InvalidGroupMembershipChangeError,
  SignerUnavailableError,
} from "@/utils/errors";
import { toSafeSigner, type SafeSigner, type Signer } from "@/utils/signer";

export type ExtractCodecContentTypes<C extends ContentCodec[] = []> =
  [...C, GroupUpdatedCodec, TextCodec][number] extends ContentCodec<infer T>
    ? T
    : never;

/**
 * Client for interacting with the XMTP network
 */
export class Client<
  ContentTypes = ExtractCodecContentTypes,
> extends ClientWorkerClass {
  #codecs: Map<string, ContentCodec>;
  #conversations: Conversations<ContentTypes>;
  #debugInformation: DebugInformation<ContentTypes>;
  #identifier?: Identifier;
  #inboxId: string | undefined;
  #installationId: string | undefined;
  #installationIdBytes: Uint8Array | undefined;
  #isReady = false;
  #preferences: Preferences<ContentTypes>;
  #signer?: Signer;
  #options?: ClientOptions;

  /**
   * Creates a new XMTP client instance
   *
   * This class is not intended to be initialized directly.
   * Use `Client.create` or `Client.build` instead.
   *
   * @param options - Optional configuration for the client
   */
  constructor(options?: ClientOptions) {
    const worker = new Worker(new URL("./workers/client", import.meta.url), {
      type: "module",
    });
    super(
      worker,
      options?.loggingLevel !== undefined && options.loggingLevel !== "off",
    );
    this.#options = options;
    this.#conversations = new Conversations(this);
    this.#debugInformation = new DebugInformation(this);
    this.#preferences = new Preferences(this);
    const codecs = [
      new GroupUpdatedCodec(),
      new TextCodec(),
      ...(options?.codecs ?? []),
    ];
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  /**
   * Initializes the client with the provided identifier
   *
   * This is not meant to be called directly.
   * Use `Client.create` or `Client.build` instead.
   *
   * @param identifier - The identifier to initialize the client with
   */
  async init(identifier: Identifier) {
    const result = await this.sendMessage("client.init", {
      identifier,
      options: this.#options,
    });
    this.#identifier = identifier;
    this.#inboxId = result.inboxId;
    this.#installationId = result.installationId;
    this.#installationIdBytes = result.installationIdBytes;
    this.#isReady = true;
  }

  /**
   * Creates a new client instance with a signer
   *
   * @param signer - The signer to use for authentication
   * @param options - Optional configuration for the client
   * @returns A new client instance
   */
  static async create<ContentCodecs extends ContentCodec[] = []>(
    signer: Signer,
    options?: Omit<ClientOptions, "codecs"> & {
      codecs?: ContentCodecs;
    },
  ) {
    const client = new Client<ExtractCodecContentTypes<ContentCodecs>>(options);
    client.#signer = signer;

    await client.init(await signer.getIdentifier());

    if (!options?.disableAutoRegister) {
      await client.register();
    }

    return client;
  }

  /**
   * Creates a new client instance with an identifier
   *
   * Clients created with this method must already be registered.
   * Any methods called that require a signer will throw an error.
   *
   * @param identifier - The identifier to use
   * @param options - Optional configuration for the client
   * @returns A new client instance
   */
  static async build<ContentCodecs extends ContentCodec[] = []>(
    identifier: Identifier,
    options?: Omit<ClientOptions, "codecs"> & {
      codecs?: ContentCodecs;
    },
  ) {
    const client = new Client<ExtractCodecContentTypes<ContentCodecs>>({
      ...options,
      disableAutoRegister: true,
    });
    await client.init(identifier);
    return client;
  }

  /**
   * Gets the client options
   */
  get options() {
    return this.#options;
  }

  /**
   * Gets the signer associated with this client
   */
  get signer() {
    return this.#signer;
  }

  /**
   * Gets whether the client has been initialized
   */
  get isReady() {
    return this.#isReady;
  }

  /**
   * Gets the inbox ID associated with this client
   */
  get inboxId() {
    return this.#inboxId;
  }

  /**
   * Gets the account identifier for this client
   */
  get accountIdentifier() {
    return this.#identifier;
  }

  /**
   * Gets the installation ID for this client
   */
  get installationId() {
    return this.#installationId;
  }

  /**
   * Gets the installation ID bytes for this client
   */
  get installationIdBytes() {
    return this.#installationIdBytes;
  }

  /**
   * Gets the conversations manager for this client
   */
  get conversations() {
    return this.#conversations;
  }

  /**
   * Gets the debug information helpers for this client
   */
  get debugInformation() {
    return this.#debugInformation;
  }

  /**
   * Gets the preferences manager for this client
   */
  get preferences() {
    return this.#preferences;
  }

  /**
   * Creates signature text for creating a new inbox
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register` method instead.
   *
   * @returns The signature text and signature request ID
   */
  async unsafe_createInboxSignatureText() {
    return this.sendMessage("client.createInboxSignatureText", {
      signatureRequestId: v4(),
    });
  }

  /**
   * Creates signature text for adding a new account to the client's inbox
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `unsafe_addAccount` method instead.
   *
   * @param newIdentifier - The identifier of the new account
   * @param allowInboxReassign - Whether to allow inbox reassignment
   * @throws {InboxReassignError} if `allowInboxReassign` is false
   * @returns The signature text and signature request ID
   */
  async unsafe_addAccountSignatureText(
    newIdentifier: Identifier,
    allowInboxReassign: boolean = false,
  ) {
    if (!allowInboxReassign) {
      throw new InboxReassignError();
    }

    return this.sendMessage("client.addAccountSignatureText", {
      newIdentifier,
      signatureRequestId: v4(),
    });
  }

  /**
   * Creates signature text for removing an account from the client's inbox
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `removeAccount` method instead.
   *
   * @param identifier - The identifier of the account to remove
   * @returns The signature text and signature request ID
   */
  async unsafe_removeAccountSignatureText(identifier: Identifier) {
    return this.sendMessage("client.removeAccountSignatureText", {
      identifier,
      signatureRequestId: v4(),
    });
  }

  /**
   * Creates signature text for revoking all other installations of the
   * client's inbox
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `revokeAllOtherInstallations` method instead.
   *
   * @returns The signature text and signature request ID
   */
  async unsafe_revokeAllOtherInstallationsSignatureText() {
    return this.sendMessage("client.revokeAllOtherInstallationsSignatureText", {
      signatureRequestId: v4(),
    });
  }

  /**
   * Creates signature text for revoking specific installations of the
   * client's inbox
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `revokeInstallations` method instead.
   *
   * @param installationIds - The installation IDs to revoke
   * @returns The signature text and signature request ID
   */
  async unsafe_revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    return this.sendMessage("client.revokeInstallationsSignatureText", {
      installationIds,
      signatureRequestId: v4(),
    });
  }

  /**
   * Creates signature text for changing the recovery identifier for this
   * client's inbox
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `changeRecoveryIdentifier` method instead.
   *
   * @param identifier - The new recovery identifier
   * @returns The signature text and signature request ID
   */
  async unsafe_changeRecoveryIdentifierSignatureText(identifier: Identifier) {
    return this.sendMessage("client.changeRecoveryIdentifierSignatureText", {
      identifier,
      signatureRequestId: v4(),
    });
  }

  /**
   * Applies a signature request to the client
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `unsafe_addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, `revokeInstallations`,
   * or `changeRecoveryIdentifier` method instead.
   *
   * @param signer - The signer to use
   * @param signatureRequestId - The ID of the signature request to apply
   */
  async unsafe_applySignatureRequest(
    signer: SafeSigner,
    signatureRequestId: string,
  ) {
    return this.sendMessage("client.applySignatureRequest", {
      signer,
      signatureRequestId,
    });
  }

  /**
   * Registers the client with the XMTP network
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @throws {SignerUnavailableError} if no signer is available
   */
  async register() {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const { signatureText, signatureRequestId } =
      await this.unsafe_createInboxSignatureText();

    // if the signature text or request ID is not available, don't register
    if (!signatureText || !signatureRequestId) {
      return;
    }

    const signature = await this.#signer.signMessage(signatureText);
    const signer = await toSafeSigner(this.#signer, signature);

    return this.sendMessage("client.registerIdentity", {
      signer,
      signatureRequestId,
    });
  }

  /**
   * Adds a new account to the client inbox
   *
   * WARNING: This function should be used with caution. Adding a wallet already
   * associated with an inbox ID will cause the wallet to lose access to
   * that inbox.
   *
   * The `allowInboxReassign` parameter must be true to reassign an inbox
   * already associated with a different account.
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param newAccountSigner - The signer for the new account
   * @param allowInboxReassign - Whether to allow inbox reassignment
   * @throws {SignerUnavailableError} if no signer is available
   * @throws {InboxReassignError} if `allowInboxReassign` is false
   * @throws {AccountAlreadyAssociatedError} if the account is already associated with an inbox ID
   */
  async unsafe_addAccount(
    newAccountSigner: Signer,
    allowInboxReassign: boolean = false,
  ) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    if (!allowInboxReassign) {
      throw new InboxReassignError();
    }

    // check for existing inbox id
    const existingInboxId = await this.findInboxIdByIdentifier(
      await newAccountSigner.getIdentifier(),
    );

    if (existingInboxId) {
      throw new AccountAlreadyAssociatedError(existingInboxId);
    }

    const { signatureText, signatureRequestId } =
      await this.unsafe_addAccountSignatureText(
        await newAccountSigner.getIdentifier(),
        true,
      );
    const signature = await newAccountSigner.signMessage(signatureText);
    const signer = await toSafeSigner(newAccountSigner, signature);
    return this.sendMessage("client.addAccount", {
      identifier: signer.identifier,
      signer,
      signatureRequestId,
    });
  }

  /**
   * Removes an account from the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param accountIdentifier - The identifier of the account to remove
   * @throws {SignerUnavailableError} if no signer is available
   */
  async removeAccount(identifier: Identifier) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const { signatureText, signatureRequestId } =
      await this.unsafe_removeAccountSignatureText(identifier);
    const signature = await this.#signer.signMessage(signatureText);
    const signer = await toSafeSigner(this.#signer, signature);

    return this.sendMessage("client.removeAccount", {
      identifier,
      signer,
      signatureRequestId,
    });
  }

  /**
   * Revokes all other installations of the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeAllOtherInstallations() {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const { signatureText, signatureRequestId } =
      await this.unsafe_revokeAllOtherInstallationsSignatureText();
    const signature = await this.#signer.signMessage(signatureText);
    const signer = await toSafeSigner(this.#signer, signature);

    return this.sendMessage("client.revokeAllOtherInstallations", {
      signer,
      signatureRequestId,
    });
  }

  /**
   * Revokes specific installations of the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param installationIds - The installation IDs to revoke
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeInstallations(installationIds: Uint8Array[]) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const { signatureText, signatureRequestId } =
      await this.unsafe_revokeInstallationsSignatureText(installationIds);
    const signature = await this.#signer.signMessage(signatureText);
    const signer = await toSafeSigner(this.#signer, signature);

    return this.sendMessage("client.revokeInstallations", {
      installationIds,
      signer,
      signatureRequestId,
    });
  }

  /**
   * Revokes specific installations of the client's inbox without a client
   *
   * @param env - The environment to use
   * @param signer - The signer to use
   * @param inboxId - The inbox ID to revoke installations for
   * @param installationIds - The installation IDs to revoke
   */
  static async revokeInstallations(
    signer: Signer,
    inboxId: string,
    installationIds: Uint8Array[],
    env?: XmtpEnv,
    enableLogging?: boolean,
  ) {
    const utils = new Utils(enableLogging);
    await utils.init();
    await utils.revokeInstallations(signer, inboxId, installationIds, env);
    utils.close();
  }

  /**
   * Gets the inbox state for the specified inbox IDs without a client
   *
   * @param inboxIds - The inbox IDs to get the state for
   * @param env - The environment to use
   * @returns The inbox state for the specified inbox IDs
   */
  static async inboxStateFromInboxIds(
    inboxIds: string[],
    env?: XmtpEnv,
    enableLogging?: boolean,
  ) {
    const utils = new Utils(enableLogging);
    await utils.init();
    const result = await utils.inboxStateFromInboxIds(inboxIds, env);
    utils.close();
    return result;
  }

  /**
   * Changes the recovery identifier for the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param identifier - The new recovery identifier
   * @throws {SignerUnavailableError} if no signer is available
   */
  async changeRecoveryIdentifier(identifier: Identifier) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const { signatureText, signatureRequestId } =
      await this.unsafe_changeRecoveryIdentifierSignatureText(identifier);
    const signature = await this.#signer.signMessage(signatureText);
    const signer = await toSafeSigner(this.#signer, signature);

    return this.sendMessage("client.changeRecoveryIdentifier", {
      identifier,
      signer,
      signatureRequestId,
    });
  }

  /**
   * Checks if the client is registered with the XMTP network
   *
   * @returns Whether the client is registered
   */
  async isRegistered() {
    return this.sendMessage("client.isRegistered", undefined);
  }

  /**
   * Checks if the client can message the specified identifiers
   *
   * @param identifiers - The identifiers to check
   * @returns Whether the client can message the identifiers
   */
  async canMessage(identifiers: Identifier[]) {
    return this.sendMessage("client.canMessage", { identifiers });
  }

  /**
   * Checks if the specified identifiers can be messaged
   *
   * @param identifiers - The identifiers to check
   * @param env - Optional XMTP environment
   * @returns Map of identifiers to whether they can be messaged
   */
  static async canMessage(identifiers: Identifier[], env?: XmtpEnv) {
    const canMessageMap = new Map<string, boolean>();
    const utils = new Utils();
    for (const identifier of identifiers) {
      const inboxId = await utils.getInboxIdForIdentifier(identifier, env);
      canMessageMap.set(
        identifier.identifier.toLowerCase(),
        inboxId !== undefined,
      );
    }
    utils.close();
    return canMessageMap;
  }

  /**
   * Finds the inbox ID for a given identifier
   *
   * @param identifier - The identifier to look up
   * @returns The inbox ID, if found
   */
  async findInboxIdByIdentifier(identifier: Identifier) {
    return this.sendMessage("client.findInboxIdByIdentifier", { identifier });
  }

  /**
   * Gets the codec for a given content type
   *
   * @param contentType - The content type to get the codec for
   * @returns The codec, if found
   */
  codecFor<ContentType = unknown>(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString()) as
      | ContentCodec<ContentType>
      | undefined;
  }

  /**
   * Encodes content for a given content type
   *
   * @param content - The content to encode
   * @param contentType - The content type to encode for
   * @returns The encoded content
   * @throws {CodecNotFoundError} if no codec is found for the content type
   */
  encodeContent(content: ContentTypes, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new CodecNotFoundError(contentType);
    }
    const encoded = codec.encode(content, this);
    const fallback = codec.fallback(content);
    if (fallback) {
      encoded.fallback = fallback;
    }
    return toSafeEncodedContent(encoded);
  }

  /**
   * Decodes a message for a given content type
   *
   * @param message - The message to decode
   * @param contentType - The content type to decode for
   * @returns The decoded content
   * @throws {CodecNotFoundError} if no codec is found for the content type
   * @throws {InvalidGroupMembershipChangeError} if the message is an invalid group membership change
   */
  decodeContent<ContentType = unknown>(
    message: SafeMessage,
    contentType: ContentTypeId,
  ) {
    const codec = this.codecFor<ContentType>(contentType);
    if (!codec) {
      throw new CodecNotFoundError(contentType);
    }

    // throw an error if there's an invalid group membership change message
    if (
      contentType.sameAs(ContentTypeGroupUpdated) &&
      message.kind !== GroupMessageKind.MembershipChange
    ) {
      throw new InvalidGroupMembershipChangeError(message.id);
    }

    const encodedContent = fromSafeEncodedContent(message.content);

    return codec.decode(encodedContent, this);
  }

  /**
   * Signs a message with the installation key
   *
   * @param signatureText - The text to sign
   * @returns The signature
   */
  signWithInstallationKey(signatureText: string) {
    return this.sendMessage("client.signWithInstallationKey", {
      signatureText,
    });
  }

  /**
   * Verifies a signature was made with the installation key
   *
   * @param signatureText - The text that was signed
   * @param signatureBytes - The signature bytes to verify
   * @returns Whether the signature is valid
   */
  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    return this.sendMessage("client.verifySignedWithInstallationKey", {
      signatureText,
      signatureBytes,
    });
  }

  /**
   * Verifies a signature was made with a public key
   *
   * @param signatureText - The text that was signed
   * @param signatureBytes - The signature bytes to verify
   * @param publicKey - The public key to verify against
   * @returns Whether the signature is valid
   */
  verifySignedWithPublicKey(
    signatureText: string,
    signatureBytes: Uint8Array,
    publicKey: Uint8Array,
  ) {
    return this.sendMessage("client.verifySignedWithPublicKey", {
      signatureText,
      signatureBytes,
      publicKey,
    });
  }

  /**
   * Gets the key package statuses for the specified installation IDs
   *
   * @param installationIds - The installation IDs to check
   * @returns The key package statuses
   */
  async getKeyPackageStatusesForInstallationIds(installationIds: string[]) {
    return this.sendMessage("client.getKeyPackageStatusesForInstallationIds", {
      installationIds,
    });
  }
}
