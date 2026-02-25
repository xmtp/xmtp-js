import { type ContentCodec } from "@xmtp/content-type-primitives";
import {
  applySignatureRequest,
  Backend,
  fetchInboxStatesByInboxIds,
  isAddressAuthorized as isAddressAuthorizedBinding,
  isInstallationAuthorized as isInstallationAuthorizedBinding,
  revokeInstallationsSignatureRequest,
  verifySignedWithPublicKey as verifySignedWithPublicKeyBinding,
  type ArchiveOptions,
  type Identifier,
  type InboxState,
  type Client as NodeClient,
  type SignatureRequestHandle,
} from "@xmtp/node-bindings";
import { CodecRegistry } from "@/CodecRegistry";
import { Conversations } from "@/Conversations";
import { DebugInformation } from "@/DebugInformation";
import { Preferences } from "@/Preferences";
import type { ClientOptions, ExtractCodecContentTypes, XmtpEnv } from "@/types";
import { createBackend } from "@/utils/createBackend";
import { createClient } from "@/utils/createClient";
import {
  AccountAlreadyAssociatedError,
  ClientNotInitializedError,
  InboxReassignError,
  SignerUnavailableError,
} from "@/utils/errors";
import { getInboxIdForIdentifier } from "@/utils/inboxId";
import { type Signer } from "@/utils/signer";

/**
 * Resolves a `Backend` instance from either a `Backend` or an `XmtpEnv` string.
 *
 * @param envOrBackend - A `Backend` instance, or an `XmtpEnv` string
 * @param gatewayHost - Optional gateway host (only used when `envOrBackend` is an `XmtpEnv`)
 * @returns A `Backend` instance
 */
const resolveBackend = async (
  envOrBackend?: XmtpEnv | Backend,
  gatewayHost?: string,
): Promise<Backend> => {
  if (envOrBackend instanceof Backend) {
    return envOrBackend;
  }
  return createBackend({ env: envOrBackend, gatewayHost });
};

/**
 * Client for interacting with the XMTP network
 */
export class Client<ContentTypes = ExtractCodecContentTypes> {
  #client?: NodeClient;
  #codecRegistry: CodecRegistry;
  #conversations?: Conversations<ContentTypes>;
  #debugInformation?: DebugInformation;
  #env?: XmtpEnv;
  #preferences?: Preferences;
  #signer?: Signer;
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
    this.#codecRegistry = new CodecRegistry([...(options?.codecs ?? [])]);
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
    const { client, env } = await createClient(identifier, this.#options);
    this.#client = client;
    this.#env = env;
    const conversations = this.#client.conversations();
    this.#conversations = new Conversations(
      this,
      this.#codecRegistry,
      conversations,
    );
    this.#debugInformation = new DebugInformation(this.#client);
    this.#preferences = new Preferences(this.#client, conversations);
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
    const identifier = await signer.getIdentifier();
    const client = new Client<ExtractCodecContentTypes<ContentCodecs>>(options);
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
   * Gets the version of libxmtp used in the bindings
   */
  get libxmtpVersion() {
    return this.#client?.libxmtpVersion();
  }

  /**
   * Gets the app version used by the client
   */
  get appVersion() {
    return this.#client?.appVersion();
  }

  /**
   * Gets the XMTP environment the client is connected to
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  get env(): XmtpEnv {
    if (!this.#env) {
      throw new ClientNotInitializedError();
    }
    return this.#env;
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
   * Gets the debug information helpersfor this client
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  get debugInformation() {
    if (!this.#debugInformation) {
      throw new ClientNotInitializedError();
    }
    return this.#debugInformation;
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
   * Adds a signature to a signature request using the client's signer (or the
   * provided signer)
   *
   * WARNING: This function should be used with caution. It is only provided
   * for use in special cases where the provided workflows do not meet the
   * requirements of an application.
   *
   * It is highly recommended to use the `register`, `unsafe_addAccount`,
   * `removeAccount`, `revokeAllOtherInstallations`, or `revokeInstallations`
   * methods instead.
   *
   * @param signatureRequest - The signature request to add the signature to
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async unsafe_addSignature(
    signatureRequest: SignatureRequestHandle,
    signer?: Signer,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!this.#signer) {
      throw new SignerUnavailableError();
    }

    const finalSigner = signer ?? this.#signer;
    const signature = await finalSigner.signMessage(
      await signatureRequest.signatureText(),
    );
    const identifier = await finalSigner.getIdentifier();

    switch (finalSigner.type) {
      case "SCW":
        await signatureRequest.addScwSignature(
          identifier,
          signature,
          finalSigner.getChainId(),
          finalSigner.getBlockNumber?.(),
        );
        break;
      case "EOA":
        await signatureRequest.addEcdsaSignature(signature);
        break;
    }
  }

  /**
   * Returns a signature request handler for creating a new inbox
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
  async unsafe_createInboxSignatureRequest() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.createInboxSignatureRequest();
  }

  /**
   * Returns a signature request handler for adding a new account to the
   * client's inbox
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
  async unsafe_addAccountSignatureRequest(
    newAccountIdentifier: Identifier,
    allowInboxReassign: boolean = false,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    if (!allowInboxReassign) {
      throw new InboxReassignError();
    }

    return this.#client.addIdentifierSignatureRequest(newAccountIdentifier);
  }

  /**
   * Returns a signature request handler for removing an account from the
   * client's inbox
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
  async unsafe_removeAccountSignatureRequest(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.revokeIdentifierSignatureRequest(identifier);
  }

  /**
   * Returns a signature request handler for revoking all other installations
   * of the client's inbox
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
  async unsafe_revokeAllOtherInstallationsSignatureRequest() {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.revokeAllOtherInstallationsSignatureRequest();
  }

  /**
   * Returns a signature request handler for revoking specific installations
   * of the client's inbox
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
  async unsafe_revokeInstallationsSignatureRequest(
    installationIds: Uint8Array[],
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.revokeInstallationsSignatureRequest(installationIds);
  }

  /**
   * Returns a signature request handler for changing the recovery identifier
   * for this client's inbox
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
  async unsafe_changeRecoveryIdentifierSignatureRequest(
    identifier: Identifier,
  ) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.changeRecoveryIdentifierSignatureRequest(identifier);
  }

  /**
   * Applies a signature request to the client
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
  async unsafe_applySignatureRequest(signatureRequest: SignatureRequestHandle) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.applySignatureRequest(signatureRequest);
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
    const signatureRequest = await this.unsafe_createInboxSignatureRequest();
    if (!signatureRequest) {
      return;
    }

    await this.unsafe_addSignature(signatureRequest);
    await this.#client?.registerIdentity(signatureRequest);
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
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async unsafe_addAccount(
    newAccountSigner: Signer,
    allowInboxReassign: boolean = false,
  ) {
    // check for existing inbox id
    const identifier = await newAccountSigner.getIdentifier();
    const existingInboxId = await this.fetchInboxIdByIdentifier(identifier);

    if (existingInboxId && !allowInboxReassign) {
      throw new AccountAlreadyAssociatedError(existingInboxId);
    }

    const signatureRequest = await this.unsafe_addAccountSignatureRequest(
      identifier,
      allowInboxReassign,
    );

    await this.unsafe_addSignature(signatureRequest, newAccountSigner);
    await this.unsafe_applySignatureRequest(signatureRequest);
  }

  /**
   * Removes an account from the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param identifier - The identifier of the account to remove
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async removeAccount(identifier: Identifier) {
    const signatureRequest =
      await this.unsafe_removeAccountSignatureRequest(identifier);

    await this.unsafe_addSignature(signatureRequest);
    await this.unsafe_applySignatureRequest(signatureRequest);
  }

  /**
   * Revokes all other installations of the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeAllOtherInstallations() {
    const signatureRequest =
      await this.unsafe_revokeAllOtherInstallationsSignatureRequest();

    // no other installations to revoke
    if (!signatureRequest) {
      return;
    }

    await this.unsafe_addSignature(signatureRequest);
    await this.unsafe_applySignatureRequest(signatureRequest);
  }

  /**
   * Revokes specific installations of the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param installationIds - The installation IDs to revoke
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async revokeInstallations(installationIds: Uint8Array[]) {
    const signatureRequest =
      await this.unsafe_revokeInstallationsSignatureRequest(installationIds);

    await this.unsafe_addSignature(signatureRequest);
    await this.unsafe_applySignatureRequest(signatureRequest);
  }

  /**
   * Revokes specific installations of the client's inbox without a client
   *
   * @param signer - The signer to use
   * @param inboxId - The inbox ID to revoke installations for
   * @param installationIds - The installation IDs to revoke
   * @param backend - Optional `Backend` instance created with `createBackend()`
   */
  static async revokeInstallations(
    signer: Signer,
    inboxId: string,
    installationIds: Uint8Array[],
    backend?: Backend,
  ): Promise<void>;
  /**
   * Revokes specific installations of the client's inbox without a client
   *
   * @param signer - The signer to use
   * @param inboxId - The inbox ID to revoke installations for
   * @param installationIds - The installation IDs to revoke
   * @param env - The environment to use
   * @param gatewayHost - Optional gateway host
   * @deprecated Pass a `Backend` instance created with `createBackend()` instead
   * of `XmtpEnv` and `gatewayHost`.
   */
  static async revokeInstallations(
    signer: Signer,
    inboxId: string,
    installationIds: Uint8Array[],
    env?: XmtpEnv,
    gatewayHost?: string,
  ): Promise<void>;
  static async revokeInstallations(
    signer: Signer,
    inboxId: string,
    installationIds: Uint8Array[],
    envOrBackend?: XmtpEnv | Backend,
    gatewayHost?: string,
  ) {
    const backend = await resolveBackend(envOrBackend, gatewayHost);
    const identifier = await signer.getIdentifier();
    const signatureRequest = await revokeInstallationsSignatureRequest(
      backend,
      identifier,
      inboxId,
      installationIds,
    );
    const signatureText = await signatureRequest.signatureText();
    const signature = await signer.signMessage(signatureText);

    switch (signer.type) {
      case "SCW":
        await signatureRequest.addScwSignature(
          identifier,
          signature,
          signer.getChainId(),
          signer.getBlockNumber?.(),
        );
        break;
      case "EOA":
        await signatureRequest.addEcdsaSignature(signature);
        break;
    }

    await applySignatureRequest(backend, signatureRequest);
  }

  /**
   * Changes the recovery identifier for the client's inbox
   *
   * Requires a signer, use `Client.create` to create a client with a signer.
   *
   * @param identifier - The new recovery identifier
   * @throws {ClientNotInitializedError} if the client is not initialized
   * @throws {SignerUnavailableError} if no signer is available
   */
  async changeRecoveryIdentifier(identifier: Identifier) {
    const signatureRequest =
      await this.unsafe_changeRecoveryIdentifierSignatureRequest(identifier);

    await this.unsafe_addSignature(signatureRequest);
    await this.unsafe_applySignatureRequest(signatureRequest);
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
   * Fetches the key package statuses from the network for the specified
   * installation IDs
   *
   * @param installationIds - The installation IDs to check
   * @returns The key package statuses
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async fetchKeyPackageStatuses(installationIds: string[]) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.fetchKeyPackageStatusesByInstallationIds(
      installationIds,
    );
  }

  /**
   * Fetches the inbox ID for a given identifier from the local database
   * If not found, fetches from the network
   *
   * @param identifier - The identifier to look up
   * @returns The inbox ID, if found
   * @throws {ClientNotInitializedError} if the client is not initialized
   */
  async fetchInboxIdByIdentifier(identifier: Identifier) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.getInboxIdByIdentity(identifier);
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
   * Fetches the inbox states for the specified inbox IDs from the network
   * without a client
   *
   * @param inboxIds - The inbox IDs to get the state for
   * @param backend - Optional `Backend` instance created with `createBackend()`
   * @returns The inbox states for the specified inbox IDs
   */
  static async fetchInboxStates(
    inboxIds: string[],
    backend?: Backend,
  ): Promise<InboxState[]>;
  /**
   * Fetches the inbox states for the specified inbox IDs from the network
   * without a client
   *
   * @param inboxIds - The inbox IDs to get the state for
   * @param env - The environment to use
   * @param gatewayHost - Optional gateway host
   * @returns The inbox states for the specified inbox IDs
   * @deprecated Pass a `Backend` instance created with `createBackend()` instead
   * of `XmtpEnv` and `gatewayHost`.
   */
  static async fetchInboxStates(
    inboxIds: string[],
    env?: XmtpEnv,
    gatewayHost?: string,
  ): Promise<InboxState[]>;
  static async fetchInboxStates(
    inboxIds: string[],
    envOrBackend?: XmtpEnv | Backend,
    gatewayHost?: string,
  ) {
    const backend = await resolveBackend(envOrBackend, gatewayHost);
    return fetchInboxStatesByInboxIds(backend, inboxIds);
  }

  /**
   * Checks if the specified identifiers can be messaged
   *
   * @param identifiers - The identifiers to check
   * @param backend - Optional `Backend` instance created with `createBackend()`
   * @returns Map of identifiers to whether they can be messaged
   */
  static async canMessage(
    identifiers: Identifier[],
    backend?: Backend,
  ): Promise<Map<string, boolean>>;
  /**
   * Checks if the specified identifiers can be messaged
   *
   * @param identifiers - The identifiers to check
   * @param env - Optional XMTP environment
   * @returns Map of identifiers to whether they can be messaged
   * @deprecated Pass a `Backend` instance created with `createBackend()` instead
   * of `XmtpEnv`.
   */
  /* eslint-disable @typescript-eslint/unified-signatures */
  static async canMessage(
    identifiers: Identifier[],
    env?: XmtpEnv,
  ): Promise<Map<string, boolean>>;
  /* eslint-enable @typescript-eslint/unified-signatures */
  static async canMessage(
    identifiers: Identifier[],
    envOrBackend?: XmtpEnv | Backend,
  ) {
    const backend = await resolveBackend(envOrBackend);
    const canMessageMap = new Map<string, boolean>();
    for (const identifier of identifiers) {
      const inboxId = await getInboxIdForIdentifier(backend, identifier);
      canMessageMap.set(identifier.identifier.toLowerCase(), inboxId !== null);
    }
    return canMessageMap;
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
   * @param backend - Optional `Backend` instance created with `createBackend()`
   * @returns Whether the address is authorized
   */
  static async isAddressAuthorized(
    inboxId: string,
    address: string,
    backend?: Backend,
  ): Promise<boolean>;
  /**
   * Checks if an address is authorized for an inbox
   *
   * @param inboxId - The inbox ID to check
   * @param address - The address to check
   * @param env - The environment to use
   * @param gatewayHost - Optional gateway host
   * @returns Whether the address is authorized
   * @deprecated Pass a `Backend` instance created with `createBackend()` instead
   * of `XmtpEnv` and `gatewayHost`.
   */
  static async isAddressAuthorized(
    inboxId: string,
    address: string,
    env?: XmtpEnv,
    gatewayHost?: string,
  ): Promise<boolean>;
  static async isAddressAuthorized(
    inboxId: string,
    address: string,
    envOrBackend?: XmtpEnv | Backend,
    gatewayHost?: string,
  ): Promise<boolean> {
    const backend = await resolveBackend(envOrBackend, gatewayHost);
    return await isAddressAuthorizedBinding(backend, inboxId, address);
  }

  /**
   * Checks if an installation is authorized for an inbox
   *
   * @param inboxId - The inbox ID to check
   * @param installation - The installation to check
   * @param backend - Optional `Backend` instance created with `createBackend()`
   * @returns Whether the installation is authorized
   */
  static async isInstallationAuthorized(
    inboxId: string,
    installation: Uint8Array,
    backend?: Backend,
  ): Promise<boolean>;
  /**
   * Checks if an installation is authorized for an inbox
   *
   * @param inboxId - The inbox ID to check
   * @param installation - The installation to check
   * @param env - The environment to use
   * @param gatewayHost - Optional gateway host
   * @returns Whether the installation is authorized
   * @deprecated Pass a `Backend` instance created with `createBackend()` instead
   * of `XmtpEnv` and `gatewayHost`.
   */
  static async isInstallationAuthorized(
    inboxId: string,
    installation: Uint8Array,
    env?: XmtpEnv,
    gatewayHost?: string,
  ): Promise<boolean>;
  static async isInstallationAuthorized(
    inboxId: string,
    installation: Uint8Array,
    envOrBackend?: XmtpEnv | Backend,
    gatewayHost?: string,
  ): Promise<boolean> {
    const backend = await resolveBackend(envOrBackend, gatewayHost);
    return await isInstallationAuthorizedBinding(
      backend,
      inboxId,
      installation,
    );
  }

  /**
   * Send a sync request to other devices on the network
   *
   * @param options - Archive options specifying what to sync
   * @param serverUrl - The server URL for the sync request
   * @returns Promise that resolves when the sync request is sent
   */
  async sendSyncRequest(options: ArchiveOptions, serverUrl: string) {
    if (!this.#client) {
      throw new ClientNotInitializedError();
    }

    return this.#client.deviceSync().sendSyncRequest(options, serverUrl);
  }
}
