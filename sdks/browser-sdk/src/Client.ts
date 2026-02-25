import { type ContentCodec } from "@xmtp/content-type-primitives";
import {
  Backend,
  LogLevel,
  type ArchiveOptions,
  type Identifier,
  type InboxState,
} from "@xmtp/wasm-bindings";
import { CodecRegistry } from "@/CodecRegistry";
import { Conversations } from "@/Conversations";
import { DebugInformation } from "@/DebugInformation";
import { Preferences } from "@/Preferences";
import type { ClientWorkerAction } from "@/types/actions";
import type {
  ClientOptions,
  ExtractCodecContentTypes,
  XmtpEnv,
} from "@/types/options";
import { createBackend } from "@/utils/createBackend";
import {
  AccountAlreadyAssociatedError,
  InboxReassignError,
  SignerUnavailableError,
} from "@/utils/errors";
import { getInboxIdForIdentifier } from "@/utils/inboxId";
import { inboxStateFromInboxIds as utilsInboxStateFromInboxIds } from "@/utils/inboxState";
import { revokeInstallations as utilsRevokeInstallations } from "@/utils/installations";
import { toSafeSigner, type SafeSigner, type Signer } from "@/utils/signer";
import { uuid } from "@/utils/uuid";
import { WorkerBridge } from "@/utils/WorkerBridge";

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
  #appVersion?: string;
  #codecRegistry: CodecRegistry;
  #conversations: Conversations<ContentTypes>;
  #debugInformation: DebugInformation;
  #env?: XmtpEnv;
  #identifier?: Identifier;
  #inboxId?: string;
  #installationId?: string;
  #installationIdBytes?: Uint8Array;
  #isReady = false;
  #libxmtpVersion?: string;
  #options?: ClientOptions;
  #preferences: Preferences;
  #signer?: Signer;
  #worker: WorkerBridge<ClientWorkerAction>;

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
    const enableLogging =
      options?.loggingLevel !== undefined &&
      options.loggingLevel !== LogLevel.Off;
    this.#worker = new WorkerBridge<ClientWorkerAction>(worker, enableLogging);
    this.#options = options;
    this.#codecRegistry = new CodecRegistry([...(options?.codecs ?? [])]);
    this.#conversations = new Conversations(this.#worker, this.#codecRegistry);
    this.#debugInformation = new DebugInformation(this.#worker);
    this.#preferences = new Preferences(this.#worker);
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
    const result = await this.#worker.action("client.init", {
      identifier,
      options: this.#options,
    });
    this.#appVersion = result.appVersion;
    this.#env = result.env as XmtpEnv;
    this.#identifier = identifier;
    this.#inboxId = result.inboxId;
    this.#installationId = result.installationId;
    this.#installationIdBytes = result.installationIdBytes;
    this.#libxmtpVersion = result.libxmtpVersion;
    this.#isReady = true;
  }

  /**
   * Shutdown the client
   */
  close() {
    this.#worker.close();
    this.#isReady = false;
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
   * Gets the version of libxmtp used in the bindings
   */
  get libxmtpVersion() {
    return this.#libxmtpVersion;
  }

  /**
   * Gets the app version used by the client
   */
  get appVersion() {
    return this.#appVersion;
  }

  /**
   * Gets the XMTP environment used by this client
   */
  get env() {
    return this.#env;
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
    return this.#worker.action("client.createInboxSignatureText", {
      signatureRequestId: uuid(),
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

    return this.#worker.action("client.addAccountSignatureText", {
      newIdentifier,
      signatureRequestId: uuid(),
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
    return this.#worker.action("client.removeAccountSignatureText", {
      identifier,
      signatureRequestId: uuid(),
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
    return this.#worker.action(
      "client.revokeAllOtherInstallationsSignatureText",
      {
        signatureRequestId: uuid(),
      },
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
   * @returns The signature text and signature request ID
   */
  async unsafe_revokeInstallationsSignatureText(installationIds: Uint8Array[]) {
    return this.#worker.action("client.revokeInstallationsSignatureText", {
      installationIds,
      signatureRequestId: uuid(),
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
    return this.#worker.action("client.changeRecoveryIdentifierSignatureText", {
      identifier,
      signatureRequestId: uuid(),
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
    return this.#worker.action("client.applySignatureRequest", {
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

    return this.#worker.action("client.registerIdentity", {
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
    const existingInboxId = await this.fetchInboxIdByIdentifier(
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
    return this.#worker.action("client.addAccount", {
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

    return this.#worker.action("client.removeAccount", {
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

    // no other installations to revoke, nothing to do
    if (!signatureText) {
      return;
    }

    const signature = await this.#signer.signMessage(signatureText);
    const signer = await toSafeSigner(this.#signer, signature);

    return this.#worker.action("client.revokeAllOtherInstallations", {
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

    return this.#worker.action("client.revokeInstallations", {
      installationIds,
      signer,
      signatureRequestId,
    });
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
    await utilsRevokeInstallations(backend, signer, inboxId, installationIds);
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
    return utilsInboxStateFromInboxIds(backend, inboxIds);
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

    return this.#worker.action("client.changeRecoveryIdentifier", {
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
    return this.#worker.action("client.isRegistered");
  }

  /**
   * Checks if the client can message the specified identifiers
   *
   * @param identifiers - The identifiers to check
   * @returns Whether the client can message the identifiers
   */
  async canMessage(identifiers: Identifier[]) {
    return this.#worker.action("client.canMessage", { identifiers });
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
      canMessageMap.set(
        identifier.identifier.toLowerCase(),
        inboxId !== undefined,
      );
    }
    return canMessageMap;
  }

  /**
   * Fetches the inbox ID for a given identifier from the local database
   * If not found, fetches from the network
   *
   * @param identifier - The identifier to look up
   * @returns The inbox ID, if found
   */
  async fetchInboxIdByIdentifier(identifier: Identifier) {
    return this.#worker.action("client.getInboxIdByIdentifier", { identifier });
  }

  /**
   * Signs a message with the installation key
   *
   * @param signatureText - The text to sign
   * @returns The signature
   */
  signWithInstallationKey(signatureText: string) {
    return this.#worker.action("client.signWithInstallationKey", {
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
    return this.#worker.action("client.verifySignedWithInstallationKey", {
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
    return this.#worker.action("client.verifySignedWithPublicKey", {
      signatureText,
      signatureBytes,
      publicKey,
    });
  }

  /**
   * Fetches the key package statuses from the network for the specified
   * installation IDs
   *
   * @param installationIds - The installation IDs to check
   * @returns The key package statuses
   */
  async fetchKeyPackageStatuses(installationIds: string[]) {
    return this.#worker.action("client.fetchKeyPackageStatuses", {
      installationIds,
    });
  }

  /**
   * Send a sync request to other devices on the network
   *
   * @param options - Archive options specifying what to sync
   * @param serverUrl - The server URL for the sync request
   * @returns Promise that resolves when the sync request is sent
   */
  async sendSyncRequest(options: ArchiveOptions, serverUrl: string) {
    return this.#worker.action("client.sendSyncRequest", {
      options,
      serverUrl,
    });
  }
}
