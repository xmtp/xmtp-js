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
  GroupMessageKind,
  isAddressAuthorized as isAddressAuthorizedBinding,
  isInstallationAuthorized as isInstallationAuthorizedBinding,
  SignatureRequestType,
  verifySignedWithPublicKey as verifySignedWithPublicKeyBinding,
  type Identifier,
  type Message,
  type Client as NodeClient,
} from "@xmtp/node-bindings";
import { ApiUrls } from "@/constants";
import { Conversations } from "@/Conversations";
import { Preferences } from "@/Preferences";
import type { ClientOptions, NetworkOptions, XmtpEnv } from "@/types";
import { createClient } from "@/utils/createClient";
import {
  AccountAlreadyAssociatedError,
  ClientNotInitializedError,
  CodecNotFoundError,
  GenerateSignatureError,
  InboxReassignError,
  InvalidGroupMembershipChangeError,
  SignerUnavailableError,
} from "@/utils/errors";
import { getInboxIdForIdentifier } from "@/utils/inboxId";
import { type Signer } from "@/utils/signer";
import { version } from "@/utils/version";

/**
 * Client for interacting with the XMTP network
 */
export class Client {
  #client?: NodeClient;
  #conversations?: Conversations;
  #preferences?: Preferences;
  #signer?: Signer;
  #codecs: Map<string, ContentCodec>;
  #identifier?: Identifier;
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
    this.#options = options;
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
    if (this.#client) {
      return;
    }

    this.#identifier = identifier;
    this.#client = await createClient(identifier, this.#options);
    const conversations = this.#client.conversations();
    this.#conversations = new Conversations(this, conversations);
    this.#preferences = new Preferences(this.#client, conversations);
  }

  /**
   * Creates a new client instance with a signer
   *
   * @param signer - The signer to use for authentication
   * @param options - Optional configuration for the client
   * @returns A new client instance
   */
  static async create(signer: Signer, options?: ClientOptions) {
    const identifier = await signer.getIdentifier();
    const client = new Client(options);
    client.#signer = signer;
    await client.init(identifier);

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
   * Gets the account identifier for this client
   */
  get accountIdentifier() {
    return this.#identifier;
  }

  /**
   * Gets the inbox ID associated with this client
   */
  get inboxId() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.inboxId();
  }

  /**
   * Gets the installation ID for this client
   */
  get installationId() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.installationId();
  }

  /**
   * Gets the installation ID bytes for this client
   */
  get installationIdBytes() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.installationIdBytes();
  }

  /**
   * Gets whether the client is registered with the XMTP network
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  get isRegistered() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }
    return this.#client.isRegistered();
  }

  /**
   * Gets the conversations manager for this client
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  get conversations() {
    if (!this.#conversations) {
      throw new ClientNotInitializedError();
    }
    return this.#conversations;
  }

  /**
   * Gets the preferences manager for this client
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  get preferences() {
    if (!this.#preferences) {
      throw new ClientNotInitializedError();
    }
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_createInboxSignatureText() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText = await this.#client.createInboxSignatureText();
      return signatureText;
    } catch {
      return undefined;
    }
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
   * The `allowInboxReassign` parameter must be true or this function will
   * throw an error.
   *
   * @param newAccountIdentifier - The identifier of the new account
   * @param allowInboxReassign - Whether to allow inbox reassignment
   * @returns The signature text
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_addAccountSignatureText(
    newAccountIdentifier: Identifier,
    allowInboxReassign: boolean = false,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!allowInboxReassign) {
      throw new InboxReassignError();
    }

    try {
      const signatureText =
        await this.#client.addIdentifierSignatureText(newAccountIdentifier);
      return signatureText;
    } catch {
      return undefined;
    }
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_removeAccountSignatureText(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.revokeIdentifierSignatureText(identifier);
      return signatureText;
    } catch {
      return undefined;
    }
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_revokeAllOtherInstallationsSignatureText() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.revokeAllOtherInstallationsSignatureText();
      return signatureText;
    } catch {
      return undefined;
    }
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.revokeInstallationsSignatureText(installationIds);
      return signatureText;
    } catch {
      return undefined;
    }
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_changeRecoveryIdentifierSignatureText(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      const signatureText =
        await this.#client.changeRecoveryIdentifierSignatureText(identifier);
      return signatureText;
    } catch {
      return undefined;
    }
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_addSignature(
    signatureType: SignatureRequestType,
    signatureText: string,
    signer: Signer,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    switch (signer.type) {
      case "SCW":
        await this.#client.addScwSignature(
          signatureType,
          await signer.signMessage(signatureText),
          signer.getChainId(),
          signer.getBlockNumber?.(),
        );
        break;
      case "EOA":
        await this.#client.addEcdsaSignature(
          signatureType,
          await signer.signMessage(signatureText),
        );
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
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async unsafe_applySignatures() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.applySignatureRequests();
  }

  /**
   * Registers the client with the XMTP network
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async register() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

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

    return this.#client.registerIdentity();
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {AccountAlreadyAssociatedError} if the account is already associated with an inbox ID
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async unsafe_addAccount(
    newAccountSigner: Signer,
    allowInboxReassign: boolean = false,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    // check for existing inbox id
    const identifier = await newAccountSigner.getIdentifier();
    const existingInboxId = await this.getInboxIdByIdentifier(identifier);

    if (existingInboxId && !allowInboxReassign) {
      throw new AccountAlreadyAssociatedError(existingInboxId);
    }

    const signatureText = await this.unsafe_addAccountSignatureText(
      identifier,
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
   * @param identifier - The identifier of the account to remove
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async removeAccount(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const signatureText =
      await this.unsafe_removeAccountSignatureText(identifier);

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
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {GenerateSignatureError} if the signature cannot be generated
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeAllOtherInstallations() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

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
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   * @throws {GenerateSignatureError} if the signature cannot be generated
   */
  async revokeInstallations(installationIds: Uint8Array[]) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

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
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   * @throws {GenerateSignatureError} if the signature cannot be generated
   */
  async changeRecoveryIdentifier(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

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
   * Checks if the client can message the specified identifiers
   *
   * @param identifiers - The identifiers to check
   * @returns Whether the client can message the identifiers
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async canMessage(identifiers: Identifier[]) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    const canMessage = await this.#client.canMessage(identifiers);
    return new Map(Object.entries(canMessage));
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
    for (const identifier of identifiers) {
      const inboxId = await getInboxIdForIdentifier(identifier, env);
      canMessageMap.set(identifier.identifier.toLowerCase(), inboxId !== null);
    }
    return canMessageMap;
  }

  /**
   * Gets the key package statuses for the specified installation IDs
   *
   * @param installationIds - The installation IDs to check
   * @returns The key package statuses
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async getKeyPackageStatusesForInstallationIds(installationIds: string[]) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.getKeyPackageStatusesForInstallationIds(
      installationIds,
    );
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
    return encoded;
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
  decodeContent<T = unknown>(message: Message, contentType: ContentTypeId) {
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

    return codec.decode(message.content as EncodedContent, this);
  }

  /**
   * Finds the inbox ID for a given identifier
   *
   * @param identifier - The identifier to look up
   * @returns The inbox ID, if found
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async getInboxIdByIdentifier(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.findInboxIdByIdentifier(identifier);
  }

  /**
   * Signs a message with the installation key
   *
   * @param signatureText - The text to sign
   * @returns The signature
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  signWithInstallationKey(signatureText: string) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.signWithInstallationKey(signatureText);
  }

  /**
   * Verifies a signature was made with the installation key
   *
   * @param signatureText - The text that was signed
   * @param signatureBytes - The signature bytes to verify
   * @returns Whether the signature is valid
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  verifySignedWithInstallationKey(
    signatureText: string,
    signatureBytes: Uint8Array,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    try {
      this.#client.verifySignedWithInstallationKey(
        signatureText,
        signatureBytes,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifies a signature was made with a public key
   *
   * @param signatureText - The text that was signed
   * @param signatureBytes - The signature bytes to verify
   * @param publicKey - The public key to verify against
   * @returns Whether the signature is valid
   */
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

  /**
   * Checks if an address is authorized for an inbox
   *
   * @param inboxId - The inbox ID to check
   * @param address - The address to check
   * @param options - Optional network options
   * @returns Whether the address is authorized
   */
  static async isAddressAuthorized(
    inboxId: string,
    address: string,
    options?: NetworkOptions,
  ): Promise<boolean> {
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    return await isAddressAuthorizedBinding(host, inboxId, address);
  }

  /**
   * Checks if an installation is authorized for an inbox
   *
   * @param inboxId - The inbox ID to check
   * @param installation - The installation to check
   * @param options - Optional network options
   * @returns Whether the installation is authorized
   */
  static async isInstallationAuthorized(
    inboxId: string,
    installation: Uint8Array,
    options?: NetworkOptions,
  ): Promise<boolean> {
    const host = options?.apiUrl || ApiUrls[options?.env || "dev"];
    return await isInstallationAuthorizedBinding(host, inboxId, installation);
  }

  /**
   * Gets the version of the Node bindings
   */
  static get version() {
    return version;
  }
}
