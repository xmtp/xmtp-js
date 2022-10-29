import {
  PublicKeyBundle,
  SignedPublicKeyBundle,
  PrivateKeyBundleV1,
  PrivateKeyBundleV2,
} from './crypto'
import {
  buildUserContactTopic,
  mapPaginatedStream,
  EnvelopeMapper,
  buildUserInviteTopic,
} from './utils'
import { Signer } from 'ethers'
import {
  EncryptedKeyStore,
  KeyStore,
  PrivateTopicStore,
  StaticKeyStore,
} from './store'
import { Conversations } from './conversations'
import { ContentTypeText, TextCodec } from './codecs/Text'
import { ContentTypeId, ContentCodec } from './MessageContent'
import { compress } from './Compression'
import { xmtpEnvelope, messageApi, fetcher } from '@xmtp/proto'
import { decodeContactBundle, encodeContactBundle } from './ContactBundle'
import ApiClient, { PublishParams, SortDirection } from './ApiClient'
import { Authenticator } from './authn'
import { SealedInvitation } from './Invitation'
const { Compression } = xmtpEnvelope
const { b64Decode } = fetcher

// eslint-disable @typescript-eslint/explicit-module-boundary-types
// eslint-disable @typescript-eslint/no-explicit-any

// Default maximum allowed content size
const MaxContentSize = 100 * 1024 * 1024 // 100M

export const ApiUrls = {
  local: 'http://localhost:5555',
  dev: 'https://dev.xmtp.network',
  production: 'https://production.xmtp.network',
} as const

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

export enum KeyStoreType {
  networkTopicStoreV1,
  static,
}

// Parameters for the send functions
export { Compression }
export type SendOptions = {
  contentType?: ContentTypeId
  contentFallback?: string
  compression?: xmtpEnvelope.Compression
  timestamp?: Date
}

/**
 * Network startup options
 */
type NetworkOptions = {
  // Allow for specifying different envs later
  env: keyof typeof ApiUrls
  // apiUrl can be used to override the default URL for the env
  apiUrl: string | undefined
  // app identifier included with client version header
  appVersion?: string
}

type ContentOptions = {
  // Allow configuring codecs for additional content types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  codecs: ContentCodec<any>[]

  // Set the maximum content size in bytes that is allowed by the Client.
  // Currently only checked when decompressing compressed content.
  maxContentSize: number
}

type KeyStoreOptions = {
  /** Specify the keyStore which should be used for loading or saving privateKeyBundles */
  keyStoreType: KeyStoreType
  privateKeyOverride?: Uint8Array
}

/**
 * Aggregate type for client options. Optional properties are used when the default value is calculated on invocation, and are computed
 * as needed by each function. All other defaults are specified in defaultOptions.
 */
export type ClientOptions = NetworkOptions & KeyStoreOptions & ContentOptions

/**
 * Provide a default client configuration. These settings can be used on their own, or as a starting point for custom configurations
 *
 * @param opts additional options to override the default settings
 */
export function defaultOptions(opts?: Partial<ClientOptions>): ClientOptions {
  const _defaultOptions: ClientOptions = {
    keyStoreType: KeyStoreType.networkTopicStoreV1,
    privateKeyOverride: undefined,
    env: 'dev',
    apiUrl: undefined,
    codecs: [new TextCodec()],
    maxContentSize: MaxContentSize,
  }
  if (opts?.codecs) {
    opts.codecs = _defaultOptions.codecs.concat(opts.codecs)
  }
  if (opts?.privateKeyOverride && !opts?.keyStoreType) {
    opts.keyStoreType = KeyStoreType.static
  }
  return { ..._defaultOptions, ...opts } as ClientOptions
}

/**
 * Client class initiates connection to the XMTP network.
 * Should be created with `await Client.create(options)`
 */
export default class Client {
  address: string
  legacyKeys: PrivateKeyBundleV1
  keys: PrivateKeyBundleV2
  apiClient: ApiClient
  contacts: Set<string> // address which we have connected to
  private knownPublicKeyBundles: Map<
    string,
    PublicKeyBundle | SignedPublicKeyBundle
  > // addresses and key bundles that we have witnessed

  private _conversations: Conversations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _codecs: Map<string, ContentCodec<any>>
  private _maxContentSize: number

  constructor(keys: PrivateKeyBundleV1, apiClient: ApiClient) {
    this.contacts = new Set<string>()
    this.knownPublicKeyBundles = new Map<
      string,
      PublicKeyBundle | SignedPublicKeyBundle
    >()
    this.legacyKeys = keys
    this.keys = PrivateKeyBundleV2.fromLegacyBundle(keys)
    this.address = keys.identityKey.publicKey.walletSignatureAddress()
    this._conversations = new Conversations(this)
    this._codecs = new Map()
    this._maxContentSize = MaxContentSize
    this.apiClient = apiClient
  }

  /**
   * @type {Conversations}
   */
  get conversations(): Conversations {
    return this._conversations
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
    const keys = await loadOrCreateKeysFromOptions(options, wallet, apiClient)
    apiClient.setAuthenticator(new Authenticator(keys.identityKey))
    const client = new Client(keys, apiClient)
    await client.init(options)
    return client
  }

  static async getKeys(
    wallet: Signer | null,
    opts?: Partial<ClientOptions>
  ): Promise<Uint8Array> {
    const client = await Client.create(wallet, opts)
    return client.legacyKeys.encode()
  }

  async init(options: ClientOptions): Promise<void> {
    options.codecs.forEach((codec) => {
      this.registerCodec(codec)
    })
    this._maxContentSize = options.maxContentSize
    await this.publishUserContact()
  }

  // gracefully shut down the client
  async close(): Promise<void> {
    return undefined
  }

  // publish the key bundle into the contact topic
  // WARNING: temporarily public to allow testing negotiated topics
  // TODO: make private again asap
  async publishUserContact(legacy = true): Promise<void> {
    const keys = legacy ? this.legacyKeys : this.keys
    await this.publishEnvelopes([
      {
        contentTopic: buildUserContactTopic(this.address),
        message: encodeContactBundle(keys.getPublicKeyBundle()),
      },
    ])
  }

  /**
   * Returns the cached PublicKeyBundle if one is known for the given address or fetches
   * one from the network
   */

  async getUserContact(
    peerAddress: string
  ): Promise<PublicKeyBundle | SignedPublicKeyBundle | undefined> {
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

  forgetContact(peerAddress: string) {
    this.knownPublicKeyBundles.delete(peerAddress)
  }

  /**
   * Check if @peerAddress can be messaged, specifically it checks that a PublicKeyBundle can be
   * found for the given address
   */
  public async canMessage(peerAddress: string): Promise<boolean> {
    const keyBundle = await this.getUserContact(peerAddress)
    return keyBundle !== undefined
  }

  static async canMessage(
    peerAddress: string,
    opts?: Partial<NetworkOptions>
  ): Promise<boolean> {
    const apiUrl = opts?.apiUrl || ApiUrls[opts?.env || 'dev']
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerCodec(codec: ContentCodec<any>): void {
    const id = codec.contentType
    const key = `${id.authorityId}/${id.typeId}`
    this._codecs.set(key, codec)
  }

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
    if (options?.compression) {
      encoded.compression = options.compression
    }
    await compress(encoded)
    return xmtpEnvelope.EncodedContent.encode(encoded).finish()
  }

  listInvitations(opts?: ListMessagesOptions): Promise<SealedInvitation[]> {
    return this.listEnvelopes(
      [buildUserInviteTopic(this.address)],
      SealedInvitation.fromEnvelope,
      opts
    )
  }

  // list stored messages from the specified topic
  async listEnvelopes<Out>(
    topics: string[],
    mapper: EnvelopeMapper<Out>,
    opts?: ListMessagesOptions
  ): Promise<Out[]> {
    if (!opts) {
      opts = {}
    }
    const { startTime, endTime, limit } = opts

    const envelopes = await this.apiClient.query(
      { contentTopics: topics, startTime, endTime },
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
    contentTopics: string[],
    mapper: EnvelopeMapper<Out>,
    opts?: ListMessagesPaginatedOptions
  ): AsyncGenerator<Out[]> {
    return mapPaginatedStream(
      this.apiClient.queryIteratePages(
        {
          contentTopics,
          startTime: opts?.startTime,
          endTime: opts?.endTime,
        },
        { direction: opts?.direction, pageSize: opts?.pageSize || 100 }
      ),
      mapper
    )
  }
}

function createKeyStoreFromConfig(
  opts: KeyStoreOptions,
  wallet: Signer | null,
  apiClient: ApiClient
): KeyStore {
  switch (opts.keyStoreType) {
    case KeyStoreType.networkTopicStoreV1:
      if (!wallet) {
        throw new Error('Must provide a wallet for networkTopicStore')
      }
      return createNetworkPrivateKeyStore(wallet, apiClient)

    case KeyStoreType.static:
      if (!opts.privateKeyOverride) {
        throw new Error('Must provide a privateKeyOverride to use static store')
      }

      return createStaticStore(opts.privateKeyOverride)
  }
}

// Create Encrypted store which uses the Network to store KeyBundles
function createNetworkPrivateKeyStore(
  wallet: Signer,
  apiClient: ApiClient
): EncryptedKeyStore {
  return new EncryptedKeyStore(wallet, new PrivateTopicStore(apiClient))
}

function createStaticStore(privateKeyOverride: Uint8Array): KeyStore {
  return new StaticKeyStore(privateKeyOverride)
}

// attempt to load pre-existing key bundle from storage,
// otherwise create new key-bundle, store it and return it
async function loadOrCreateKeysFromStore(
  wallet: Signer | null,
  store: KeyStore
): Promise<PrivateKeyBundleV1> {
  let keys = await store.loadPrivateKeyBundle()
  if (keys) {
    return keys
  }
  if (!wallet) {
    throw new Error('No wallet found')
  }
  keys = await PrivateKeyBundleV1.generate(wallet)
  await store.storePrivateKeyBundle(keys)
  return keys
}

async function loadOrCreateKeysFromOptions(
  options: ClientOptions,
  wallet: Signer | null,
  apiClient: ApiClient
) {
  if (!options.privateKeyOverride && !wallet) {
    throw new Error(
      'Must provide either an ethers.Signer or specify privateKeyOverride'
    )
  }

  const keyStore = createKeyStoreFromConfig(options, wallet, apiClient)
  return loadOrCreateKeysFromStore(wallet, keyStore)
}

function createApiClientFromOptions(options: ClientOptions): ApiClient {
  const apiUrl = options.apiUrl || ApiUrls[options.env]
  return new ApiClient(apiUrl, { appVersion: options.appVersion })
}

// retrieve a key bundle from given user's contact topic
async function getUserContactFromNetwork(
  apiClient: ApiClient,
  peerAddress: string
): Promise<PublicKeyBundle | SignedPublicKeyBundle | undefined> {
  const stream = apiClient.queryIterator(
    { contentTopics: [buildUserContactTopic(peerAddress)] },
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
