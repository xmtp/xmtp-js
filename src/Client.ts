import { PrivateKeyBundleV1 } from './crypto/PrivateKeyBundle'
import { PublicKeyBundle, SignedPublicKeyBundle } from './crypto'
import {
  buildUserContactTopic,
  mapPaginatedStream,
  EnvelopeMapper,
  buildUserInviteTopic,
} from './utils'
import { utils } from 'ethers'
import { Signer } from './types/Signer'
import { Conversations } from './conversations'
import { ContentTypeText, TextCodec } from './codecs/Text'
import { ContentTypeId, ContentCodec } from './MessageContent'
import { compress } from './Compression'
import { content as proto, messageApi, fetcher } from '@xmtp/proto'
import { decodeContactBundle, encodeContactBundle } from './ContactBundle'
import ApiClient, { ApiUrls, PublishParams, SortDirection } from './ApiClient'
import { KeystoreAuthenticator } from './authn'
import { Flatten } from './utils/typedefs'
import BackupClient, { BackupType } from './message-backup/BackupClient'
import { createBackupClient } from './message-backup/BackupClientFactory'
import { Keystore } from './keystore'
import {
  KeyGeneratorKeystoreProvider,
  KeystoreProvider,
  KeystoreProviderUnavailableError,
  NetworkKeystoreProvider,
  StaticKeystoreProvider,
} from './keystore/providers'
const { Compression } = proto
const { b64Decode } = fetcher

// eslint-disable @typescript-eslint/explicit-module-boundary-types
// eslint-disable @typescript-eslint/no-explicit-any

// Default maximum allowed content size
const MaxContentSize = 100 * 1024 * 1024 // 100M

// Parameters for the listMessages functions
export type ListMessagesOptions = {
  checkAddresses?: boolean
  startTime?: Date
  endTime?: Date
  limit?: number
  direction?: messageApi.SortDirection
}

export type ListMessagesPaginatedOptions = {
  startTime?: Date
  endTime?: Date
  pageSize?: number
  direction?: messageApi.SortDirection
}

// Parameters for the send functions
export { Compression }
export type SendOptions = {
  contentType?: ContentTypeId
  contentFallback?: string
  compression?: proto.Compression
  timestamp?: Date
  ephemeral?: boolean
}

export type XmtpEnv = keyof typeof ApiUrls

/**
 * Network startup options
 */
export type NetworkOptions = {
  /**
   * Specify which XMTP environment to connect to. (default: `dev`)
   */
  env: XmtpEnv
  /**
   * apiUrl can be used to override the `env` flag and connect to a
   * specific endpoint
   */
  apiUrl: string | undefined
  /**
   * identifier that's included with API requests.
   *
   * For example, you can use the following format:
   * `appVersion: APP_NAME + '/' + APP_VERSION`.
   * Setting this value provides telemetry that shows which apps are
   * using the XMTP client SDK. This information can help XMTP developers
   * provide app support, especially around communicating important
   * SDK updates, including deprecations and required upgrades.
   */
  appVersion?: string
  /**
   * Skip publishing the user's contact bundle as part of Client startup.
   *
   * This flag should be used with caution, as we rely on contact publishing to
   * let other users know your public key and periodically run migrations on
   * this data with new SDK versions.
   *
   * Your application should have this flag set to `false` at least _some_ of the
   * time.
   *
   * The most common use-case for setting this to `true` is cases where the Client
   * instance is very short-lived. For example, spinning up a Client to decrypt
   * a push notification.
   */
  skipContactPublishing: boolean
}

export type ContentOptions = {
  /**
   * Allow configuring codecs for additional content types
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codecs: ContentCodec<any>[]

  /**
   * Set the maximum content size in bytes that is allowed by the Client.
   * Currently only checked when decompressing compressed content.
   */
  maxContentSize: number
}

export type KeyStoreOptions = {
  /**
   * Provide an array of KeystoreProviders.
   * The client will attempt to use each one in sequence until one successfully
   * returns a Keystore instance
   */
  keystoreProviders: KeystoreProvider[]
  /**
   * Enable the Keystore to persist conversations in the provided storage interface
   */
  persistConversations: boolean
  /**
   * Provide a XMTP PrivateKeyBundle encoded as a Uint8Array.
   * A bundle can be retried using `Client.getKeys(...)`
   */
  privateKeyOverride?: Uint8Array
}

export type LegacyOptions = {
  publishLegacyContact?: boolean
}

/**
 * Aggregate type for client options. Optional properties are used when the default value is calculated on invocation, and are computed
 * as needed by each function. All other defaults are specified in defaultOptions.
 */
export type ClientOptions = Flatten<
  NetworkOptions & KeyStoreOptions & ContentOptions & LegacyOptions
>

/**
 * Provide a default client configuration. These settings can be used on their own, or as a starting point for custom configurations
 *
 * @param opts additional options to override the default settings
 */
export function defaultOptions(opts?: Partial<ClientOptions>): ClientOptions {
  const _defaultOptions: ClientOptions = {
    privateKeyOverride: undefined,
    env: 'dev',
    apiUrl: undefined,
    codecs: [new TextCodec()],
    maxContentSize: MaxContentSize,
    persistConversations: true,
    skipContactPublishing: false,
    keystoreProviders: defaultKeystoreProviders(),
  }
  if (opts?.codecs) {
    opts.codecs = _defaultOptions.codecs.concat(opts.codecs)
  }

  return { ..._defaultOptions, ...opts } as ClientOptions
}

/**
 * Client class initiates connection to the XMTP network.
 * Should be created with `await Client.create(options)`
 */
export default class Client {
  address: string
  keystore: Keystore
  apiClient: ApiClient
  contacts: Set<string> // address which we have connected to
  publicKeyBundle: PublicKeyBundle
  private knownPublicKeyBundles: Map<
    string,
    PublicKeyBundle | SignedPublicKeyBundle
  > // addresses and key bundles that we have witnessed

  private _backupClient: BackupClient
  private _conversations: Conversations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _codecs: Map<string, ContentCodec<any>>
  private _maxContentSize: number

  constructor(
    publicKeyBundle: PublicKeyBundle,
    apiClient: ApiClient,
    backupClient: BackupClient,
    keystore: Keystore
  ) {
    this.contacts = new Set<string>()
    this.knownPublicKeyBundles = new Map<
      string,
      PublicKeyBundle | SignedPublicKeyBundle
    >()
    // TODO: Remove keys and legacyKeys
    this.keystore = keystore
    this.publicKeyBundle = publicKeyBundle
    this.address = publicKeyBundle.walletSignatureAddress()
    this._conversations = new Conversations(this)
    this._codecs = new Map()
    this._maxContentSize = MaxContentSize
    this.apiClient = apiClient
    this._backupClient = backupClient
  }

  /**
   * @type {Conversations}
   */
  get conversations(): Conversations {
    return this._conversations
  }

  get backupType(): BackupType {
    return this._backupClient.backupType
  }

  get signedPublicKeyBundle(): SignedPublicKeyBundle {
    return SignedPublicKeyBundle.fromLegacyBundle(this.publicKeyBundle)
  }

  /**
   * Create and start a client associated with given wallet.
   *
   * @param wallet the wallet as a Signer instance
   * @param opts specify how to to connect to the network
   */
  static async create(
    wallet: Signer | null,
    opts?: Partial<ClientOptions>
  ): Promise<Client> {
    const options = defaultOptions(opts)
    const apiClient = createApiClientFromOptions(options)
    const keystore = await bootstrapKeystore(options, apiClient, wallet)
    const publicKeyBundle = new PublicKeyBundle(
      await keystore.getPublicKeyBundle()
    )
    const address = publicKeyBundle.walletSignatureAddress()
    apiClient.setAuthenticator(new KeystoreAuthenticator(keystore))
    const backupClient = await Client.setupBackupClient(address, options.env)
    const client = new Client(
      publicKeyBundle,
      apiClient,
      backupClient,
      keystore
    )
    await client.init(options)
    return client
  }

  /**
   * Export the XMTP PrivateKeyBundle from the SDK as a `Uint8Array`.
   *
   * This bundle can then be provided as `privateKeyOverride` in a
   * subsequent call to `Client.create(...)`
   *
   * Be very careful with these keys, as they can be used to
   * impersonate a user on the XMTP network and read the user's
   * messages.
   */
  static async getKeys(
    wallet: Signer | null,
    opts?: Partial<ClientOptions>
  ): Promise<Uint8Array> {
    const client = await Client.create(wallet, opts)
    const keys = await client.keystore.getPrivateKeyBundle()
    return new PrivateKeyBundleV1(keys).encode()
  }

  private static async setupBackupClient(
    walletAddress: string,
    env: keyof typeof ApiUrls
  ): Promise<BackupClient> {
    // Hard-code the provider to use for now
    const selectBackupProvider = async () => {
      return Promise.resolve({
        type: env === 'local' ? BackupType.xmtpTopicStore : BackupType.none,
      })
    }
    return createBackupClient(walletAddress, selectBackupProvider)
  }

  private async init(options: ClientOptions): Promise<void> {
    options.codecs.forEach((codec) => {
      this.registerCodec(codec)
    })
    this._maxContentSize = options.maxContentSize
    if (!options.skipContactPublishing) {
      await this.ensureUserContactPublished(options.publishLegacyContact)
    }
  }

  // gracefully shut down the client
  async close(): Promise<void> {
    return undefined
  }

  private async ensureUserContactPublished(legacy = false): Promise<void> {
    const bundle = await getUserContactFromNetwork(this.apiClient, this.address)
    if (
      bundle &&
      bundle instanceof SignedPublicKeyBundle &&
      this.signedPublicKeyBundle.equals(bundle)
    ) {
      return
    }
    // TEMPORARY: publish V1 contact to make sure there is one in the topic
    // in order to preserve compatibility with pre-v7 clients.
    // Remove when pre-v7 clients are deprecated
    await this.publishUserContact(true)
    if (!legacy) {
      await this.publishUserContact(legacy)
    }
  }

  // PRIVATE: publish the key bundle into the contact topic
  // left public for testing purposes
  async publishUserContact(legacy = false): Promise<void> {
    const bundle = legacy ? this.publicKeyBundle : this.signedPublicKeyBundle
    await this.publishEnvelopes([
      {
        contentTopic: buildUserContactTopic(this.address),
        message: encodeContactBundle(bundle),
      },
    ])
  }

  /**
   * Returns the cached PublicKeyBundle if one is known for the given address or fetches
   * one from the network
   *
   * This throws if either the address is invalid or the contact is not published.
   * See also [#canMessage].
   */
  async getUserContact(
    peerAddress: string
  ): Promise<PublicKeyBundle | SignedPublicKeyBundle | undefined> {
    peerAddress = utils.getAddress(peerAddress) // EIP55 normalize the address case.
    const existingBundle = this.knownPublicKeyBundles.get(peerAddress)
    if (existingBundle) {
      return existingBundle
    }

    const newBundle = await getUserContactFromNetwork(
      this.apiClient,
      peerAddress
    )

    if (newBundle) {
      this.knownPublicKeyBundles.set(peerAddress, newBundle)
    }

    return newBundle
  }

  /**
   * Identical to getUserContact but for multiple peer addresses
   */
  async getUserContacts(
    peerAddresses: string[]
  ): Promise<(PublicKeyBundle | SignedPublicKeyBundle | undefined)[]> {
    // EIP55 normalize all peer addresses
    const normalizedAddresses = peerAddresses.map((address) =>
      utils.getAddress(address)
    )
    // The logic here is tricky because we need to do a batch query for any uncached bundles,
    // then interleave back into an ordered array. So we create a map<string, keybundle|undefined>
    // and fill it with cached values, then take any undefined entries and form a BatchQuery from those.
    const addressToBundle = new Map<
      string,
      PublicKeyBundle | SignedPublicKeyBundle | undefined
    >()
    const uncachedAddresses = []
    for (const address of normalizedAddresses) {
      const existingBundle = this.knownPublicKeyBundles.get(address)
      if (existingBundle) {
        addressToBundle.set(address, existingBundle)
      } else {
        addressToBundle.set(address, undefined)
        uncachedAddresses.push(address)
      }
    }

    // Now do a getUserContactsFromNetwork call
    const newBundles = await getUserContactsFromNetwork(
      this.apiClient,
      uncachedAddresses
    )

    // Now merge the newBundles into the addressToBundle map
    for (let i = 0; i < newBundles.length; i++) {
      const address = uncachedAddresses[i]
      const bundle = newBundles[i]
      addressToBundle.set(address, bundle)
      // If the bundle is not undefined, cache it
      if (bundle) {
        this.knownPublicKeyBundles.set(address, bundle)
      }
    }

    // Finally return the bundles in the same order as the input addresses
    return normalizedAddresses.map((address) => addressToBundle.get(address))
  }

  /**
   * Used to force getUserContact fetch contact from the network.
   */
  forgetContact(peerAddress: string) {
    peerAddress = utils.getAddress(peerAddress) // EIP55 normalize the address case.
    this.knownPublicKeyBundles.delete(peerAddress)
  }

  public async canMessage(peerAddress: string): Promise<boolean>
  public async canMessage(peerAddress: string[]): Promise<boolean[]>

  /**
   * Check if @peerAddress can be messaged, specifically
   * it checks that a PublicKeyBundle can be found for the given address
   */
  public async canMessage(
    peerAddress: string | string[]
  ): Promise<boolean | boolean[]> {
    try {
      if (Array.isArray(peerAddress)) {
        const contacts = await this.getUserContacts(peerAddress)
        return contacts.map((contact) => !!contact)
      }
      // Else do the single address case
      const keyBundle = await this.getUserContact(peerAddress)
      return keyBundle !== undefined
    } catch (e) {
      // Instead of throwing, a bad address should just return false.
      return false
    }
  }

  static async canMessage(
    peerAddress: string,
    opts?: Partial<NetworkOptions>
  ): Promise<boolean>

  static async canMessage(
    peerAddress: string[],
    opts?: Partial<NetworkOptions>
  ): Promise<boolean[]>

  static async canMessage(
    peerAddress: string | string[],
    opts?: Partial<NetworkOptions>
  ): Promise<boolean | boolean[]> {
    const apiUrl = opts?.apiUrl || ApiUrls[opts?.env || 'dev']

    if (Array.isArray(peerAddress)) {
      const rawPeerAddresses: string[] = peerAddress
      // Try to normalize each of the peer addresses
      const normalizedPeerAddresses = rawPeerAddresses.map((address) =>
        utils.getAddress(address)
      )
      // The getUserContactsFromNetwork will return false instead of throwing
      // on invalid envelopes
      const contacts = await getUserContactsFromNetwork(
        new ApiClient(apiUrl, { appVersion: opts?.appVersion }),
        normalizedPeerAddresses
      )
      return contacts.map((contact) => !!contact)
    }
    try {
      peerAddress = utils.getAddress(peerAddress) // EIP55 normalize the address case.
    } catch (e) {
      return false
    }
    const keyBundle = await getUserContactFromNetwork(
      new ApiClient(apiUrl, { appVersion: opts?.appVersion }),
      peerAddress
    )
    return keyBundle !== undefined
  }

  private validateEnvelope(env: PublishParams): void {
    const bytes = env.message
    if (!env.contentTopic) {
      throw new Error('Missing content topic')
    }

    if (!bytes || !bytes.length) {
      throw new Error('Cannot publish empty message')
    }
  }

  /**
   * Low level method for publishing envelopes to the XMTP network with
   * no pre-processing or encryption applied.
   *
   * Primarily used internally
   *
   * @param envelopes PublishParams[]
   */
  async publishEnvelopes(envelopes: PublishParams[]): Promise<void> {
    for (const env of envelopes) {
      this.validateEnvelope(env)
    }
    try {
      await this.apiClient.publish(envelopes)
    } catch (err) {
      console.log(err)
    }
  }

  /**
   * Register a codec to be automatically used for encoding/decoding
   * messages of the given Content Type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerCodec(codec: ContentCodec<any>): void {
    const id = codec.contentType
    const key = `${id.authorityId}/${id.typeId}`
    this._codecs.set(key, codec)
  }

  /**
   * Find a matching codec for a given `ContentTypeId` from the
   * client's codec registry
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codecFor(contentType: ContentTypeId): ContentCodec<any> | undefined {
    const key = `${contentType.authorityId}/${contentType.typeId}`
    const codec = this._codecs.get(key)
    if (!codec) {
      return undefined
    }
    if (contentType.versionMajor > codec.contentType.versionMajor) {
      return undefined
    }
    return codec
  }

  /**
   * Convert arbitrary content into a serialized `EncodedContent` instance
   * with the given options
   */
  async encodeContent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    options?: SendOptions
  ): Promise<Uint8Array> {
    const contentType = options?.contentType || ContentTypeText
    const codec = this.codecFor(contentType)
    if (!codec) {
      throw new Error('unknown content type ' + contentType)
    }
    const encoded = codec.encode(content, this)
    if (options?.contentFallback) {
      encoded.fallback = options.contentFallback
    }
    if (typeof options?.compression === 'number') {
      encoded.compression = options.compression
    }
    await compress(encoded)
    return proto.EncodedContent.encode(encoded).finish()
  }

  listInvitations(opts?: ListMessagesOptions): Promise<messageApi.Envelope[]> {
    return this.listEnvelopes(
      buildUserInviteTopic(this.address),
      async (env) => env,
      opts
    )
  }

  /**
   * List stored messages from the specified topic.
   *
   * A specified mapper function will be applied to each envelope.
   * If the mapper function throws an error during processing, the
   * envelope will be discarded.
   */
  async listEnvelopes<Out>(
    topic: string,
    mapper: EnvelopeMapper<Out>,
    opts?: ListMessagesOptions
  ): Promise<Out[]> {
    if (!opts) {
      opts = {}
    }
    const { startTime, endTime, limit } = opts

    const envelopes = await this.apiClient.query(
      { contentTopic: topic, startTime, endTime },
      {
        direction:
          opts.direction || messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
        limit,
      }
    )
    const results: Out[] = []
    for (const env of envelopes) {
      if (!env.message) continue
      try {
        const res = await mapper(env)
        results.push(res)
      } catch (e) {
        console.warn('Error in listEnvelopes mapper', e)
      }
    }
    return results
  }

  /**
   * List messages on a given set of content topics, yielding one page at a time
   */
  listEnvelopesPaginated<Out>(
    contentTopic: string,
    mapper: EnvelopeMapper<Out>,
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<Out[]> {
    return mapPaginatedStream(
      this.apiClient.queryIteratePages(
        {
          contentTopic,
          startTime: opts?.startTime,
          endTime: opts?.endTime,
        },
        { direction: opts?.direction, pageSize: opts?.pageSize || 100 }
      ),
      mapper
    )
  }
}

function createApiClientFromOptions(options: ClientOptions): ApiClient {
  const apiUrl = options.apiUrl || ApiUrls[options.env]
  return new ApiClient(apiUrl, { appVersion: options.appVersion })
}

/**
 * Retrieve a key bundle from given user's contact topic
 */
async function getUserContactFromNetwork(
  apiClient: ApiClient,
  peerAddress: string
): Promise<PublicKeyBundle | SignedPublicKeyBundle | undefined> {
  const stream = apiClient.queryIterator(
    { contentTopic: buildUserContactTopic(peerAddress) },
    { pageSize: 5, direction: SortDirection.SORT_DIRECTION_DESCENDING }
  )

  for await (const env of stream) {
    if (!env.message) continue
    const keyBundle = decodeContactBundle(b64Decode(env.message.toString()))

    const address = await keyBundle?.walletSignatureAddress()
    if (address === peerAddress) {
      return keyBundle
    }
  }
  return undefined
}

/**
 * Retrieve a list of key bundles given a list of user addresses
 */
async function getUserContactsFromNetwork(
  apiClient: ApiClient,
  peerAddresses: string[]
): Promise<(PublicKeyBundle | SignedPublicKeyBundle | undefined)[]> {
  const userContactTopics = peerAddresses.map(buildUserContactTopic)
  const topicToEnvelopes = await apiClient.batchQuery(
    userContactTopics.map((topic) => ({
      contentTopic: topic,
      pageSize: 5,
      direction: SortDirection.SORT_DIRECTION_DESCENDING,
    }))
  )

  // Transform topicToEnvelopes into a list of PublicKeyBundles or undefined
  // by going through each message and attempting to decode
  return Promise.all(
    peerAddresses.map(async (address: string, index: number) => {
      const envelopes = topicToEnvelopes[index]
      if (!envelopes) {
        return undefined
      }
      for (const env of envelopes) {
        if (!env.message) continue
        try {
          const keyBundle = decodeContactBundle(
            b64Decode(env.message.toString())
          )
          const signingAddress = await keyBundle?.walletSignatureAddress()
          if (address === signingAddress) {
            return keyBundle
          } else {
            console.info('Received contact bundle with incorrect address')
          }
        } catch (e) {
          console.info('Invalid contact bundle', e)
        }
      }
      return undefined
    })
  )
}

/**
 * Get the default list of `KeystoreProviders` used in the SDK
 *
 * Particularly useful if a developer wants to add their own
 * provider to the head of the list while falling back to the
 * default functionality
 */
export function defaultKeystoreProviders(): KeystoreProvider[] {
  return [
    // First check to see if a `privateKeyOverride` is provided and use that
    new StaticKeystoreProvider(),
    // Next check to see if a EncryptedPrivateKeyBundle exists on the network for the wallet
    new NetworkKeystoreProvider(),
    // If the first two failed with `KeystoreProviderUnavailableError`, then generate a new key and write it to the network
    new KeyGeneratorKeystoreProvider(),
  ]
}

/**
 * Take an array of KeystoreProviders from the options and try them until one succeeds
 */
async function bootstrapKeystore(
  opts: ClientOptions,
  apiClient: ApiClient,
  wallet: Signer | null
): Promise<Keystore> {
  for (const provider of opts.keystoreProviders) {
    try {
      return await provider.newKeystore(opts, apiClient, wallet ?? undefined)
    } catch (err) {
      if (err instanceof KeystoreProviderUnavailableError) {
        continue
      }
      throw err
    }
  }
  throw new Error('No keystore providers available')
}
