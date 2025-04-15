import {
  ContentTypeGroupUpdated,
  GroupUpdatedCodec,
} from "@xmtp/content-type-group-updated";
import type {
  ContentCodec,
  ContentTypeId,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import {
  GroupMessageKind,
  SignatureRequestType,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ClientWorkerClass } from "@/ClientWorkerClass";
import { Conversations } from "@/Conversations";
import { Preferences } from "@/Preferences";
import type { ClientOptions, XmtpEnv } from "@/types";
import { Utils } from "@/Utils";
import {
  fromSafeEncodedContent,
  toSafeEncodedContent,
  type SafeMessage,
} from "@/utils/conversions";
import {
  AccountAlreadyAssociatedError,
  CodecNotFoundError,
  GenerateSignatureError,
  InboxReassignError,
  InvalidGroupMembershipChangeError,
  SignerUnavailableError,
} from "@/utils/errors";
import { type Signer } from "@/utils/signer";

/**
 * Client for interacting with the XMTP network
 */
export class Client extends ClientWorkerClass {
  #codecs: Map<string, ContentCodec>;
  #conversations: Conversations;
  #identifier?: Identifier;
  #inboxId: string | undefined;
  #installationId: string | undefined;
  #installationIdBytes: Uint8Array | undefined;
  #isReady = false;
  #preferences: Preferences;
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
    const result = await this.sendMessage("init", {
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
  static async create(signer: Signer, options?: ClientOptions) {
    const client = new Client(options);
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
  static async build(identifier: Identifier, options?: ClientOptions) {
    const client = new Client({
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
   * @returns The signature text
   */
  async unsafe_createInboxSignatureText() {
    return this.sendMessage("createInboxSignatureText", undefined);
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
   * @returns The signature text
   */
  async unsafe_addAccountSignatureText(
    newIdentifier: Identifier,
    allowInboxReassign: boolean = false,
  ) {
    if (!allowInboxReassign) {
      throw new InboxReassignError();
    }

    return this.sendMessage("addAccountSignatureText", {
      newIdentifier,
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
   * @returns The signature text
   */
  async unsafe_removeAccountSignatureText(identifier: Identifier) {
    return this.sendMessage("removeAccountSignatureText", {
      identifier,
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
   * @returns The signature text
   */
  async unsafe_revokeAllOtherInstallationsSignatureText() {
    return this.sendMessage(
      "revokeAllOtherInstallationsSignatureText",
      undefined,
    );
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
   * @returns The signature text
   */
  async unsafe_revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    return this.sendMessage("revokeInstallationsSignatureText", {
      installationIds,
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
   * @returns The signature text
   */
  async unsafe_changeRecoveryIdentifierSignatureText(identifier: Identifier) {
    return this.sendMessage("changeRecoveryIdentifierSignatureText", {
      identifier,
    });
  }

  /**
   * Adds a signature for a specific request type
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `unsafe_addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * methods instead.
   *
   * @param signatureType - The type of signature request
   * @param signatureText - The text to sign
   * @param signer - The signer to use
   * @warning This is an unsafe operation and should be used with caution
   */
  async unsafe_addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    const signature = await signer.signMessage(signatureText);

    switch (signer.type) {
      case "SCW":
        await this.sendMessage("addScwSignature", {
          type: signatureType,
          bytes: signature,
          chainId: signer.getChainId(),
          blockNumber: signer.getBlockNumber?.(),
        });
        break;
      case "EOA":
        await this.sendMessage("addEcdsaSignature", {
          type: signatureType,
          bytes: signature,
        });
        break;
    }
  }

  /**
   * Applies all pending signatures
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `unsafe_addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * methods instead.
   */
  async unsafe_applySignatures() {
    return this.sendMessage("applySignatures", undefined);
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

    const signatureText = await this.unsafe_createInboxSignatureText();

    // if the signature text is not available, the client is already registered
    if (!signatureText) {
      return;
    }

    await this.unsafe_addSignature(
      SignatureRequestType.CreateInbox,
      signatureText,
      this.#signer,
    );

    return this.sendMessage("registerIdentity", undefined);
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
   * @throws {AccountAlreadyAssociatedError} if the account is already associated with an inbox ID
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async unsafe_addAccount(
    newAccountSigner: Signer,
    allowInboxReassign: boolean = false,
  ) {
    // check for existing inbox id
    const existingInboxId = await this.findInboxIdByIdentifier(
      await newAccountSigner.getIdentifier(),
    );

    if (existingInboxId && !allowInboxReassign) {
      throw new AccountAlreadyAssociatedError(existingInboxId);
    }

    const signatureText = await this.unsafe_addAccountSignatureText(
      await newAccountSigner.getIdentifier(),
      true,
    );

    if (!signatureText) {
      throw new GenerateSignatureError(SignatureRequestType.AddWallet);
    }

    await this.unsafe_addSignature(
      SignatureRequestType.AddWallet,
      signatureText,
      newAccountSigner,
    );

    await this.unsafe_applySignatures();
  }

  /**
   * Removes an account from the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param accountIdentifier - The identifier of the account to remove
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async removeAccount(accountIdentifier: Identifier) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_removeAccountSignatureText(accountIdentifier);

    if (!signatureText) {
      throw new GenerateSignatureError(SignatureRequestType.RevokeWallet);
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeWallet,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  /**
   * Revokes all other installations of the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeAllOtherInstallations() {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_revokeAllOtherInstallationsSignatureText();

    if (!signatureText) {
      throw new GenerateSignatureError(
        SignatureRequestType.RevokeInstallations,
      );
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  /**
   * Revokes specific installations of the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param installationIds - The installation IDs to revoke
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeInstallations(installationIds: Uint8Array[]) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_revokeInstallationsSignatureText(installationIds);

    if (!signatureText) {
      throw new GenerateSignatureError(
        SignatureRequestType.RevokeInstallations,
      );
    }

    await this.unsafe_addSignature(
      SignatureRequestType.RevokeInstallations,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  /**
   * Changes the recovery identifier for the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param identifier - The new recovery identifier
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async changeRecoveryIdentifier(identifier: Identifier) {
    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_changeRecoveryIdentifierSignatureText(identifier);

    if (!signatureText) {
      throw new GenerateSignatureError(
        SignatureRequestType.ChangeRecoveryIdentifier,
      );
    }

    await this.unsafe_addSignature(
      SignatureRequestType.ChangeRecoveryIdentifier,
      signatureText,
      this.#signer,
    );

    await this.unsafe_applySignatures();
  }

  /**
   * Checks if the client is registered with the XMTP network
   *
   * @returns Whether the client is registered
   */
  async isRegistered() {
    return this.sendMessage("isRegistered", undefined);
  }

  /**
   * Checks if the client can message the specified identifiers
   *
   * @param identifiers - The identifiers to check
   * @returns Whether the client can message the identifiers
   */
  async canMessage(identifiers: Identifier[]) {
    return this.sendMessage("canMessage", { identifiers });
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
    return this.sendMessage("findInboxIdByIdentifier", { identifier });
  }

  /**
   * Gets the codec for a given content type
   *
   * @param contentType - The content type to get the codec for
   * @returns The codec, if found
   */
  codecFor<T = unknown>(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString()) as
      | ContentCodec<T>
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
  encodeContent(content: unknown, contentType: ContentTypeId) {
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
  decodeContent<T = unknown>(message: SafeMessage, contentType: ContentTypeId) {
    const codec = this.codecFor<T>(contentType);
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
    return this.sendMessage("signWithInstallationKey", { signatureText });
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
    return this.sendMessage("verifySignedWithInstallationKey", {
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
    return this.sendMessage("verifySignedWithPublicKey", {
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
    return this.sendMessage("getKeyPackageStatusesForInstallationIds", {
      installationIds,
    });
  }
}
