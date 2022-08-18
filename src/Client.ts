import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import Message from './Message'
import {
  buildDirectMessageTopic,
  buildUserContactTopic,
  buildUserIntroTopic,
} from './utils'
import Stream, { MessageFilter, noTransformation } from './Stream'
import { Signer } from 'ethers'
import {
  EncryptedStore,
  KeyStore,
  LocalStorageStore,
  PrivateTopicStore,
  StaticKeyStore,
} from './store'
import { Conversations } from './conversations'
import { ContentTypeText, TextCodec } from './codecs/Text'
import {
  ContentTypeId,
  EncodedContent,
  ContentCodec,
  ContentTypeFallback,
} from './MessageContent'
import { decompress, compress } from './Compression'
import { xmtpEnvelope, messageApi, fetcher } from '@xmtp/proto'
import ContactBundle from './ContactBundle'
import ApiClient from './ApiClient'
import { Authenticator } from './authn'
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
}

export enum KeyStoreType {
  networkTopicStoreV1,
  localStorage,
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
}

type ContentOptions = {
  // Allow configuring codecs for additional content types
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
  keys: PrivateKeyBundle
  apiClient: ApiClient
  private contacts: Set<string> // address which we have connected to
  private knownPublicKeyBundles: Map<string, PublicKeyBundle> // addresses and key bundles that we have witnessed
  private _conversations: Conversations
  private _codecs: Map<string, ContentCodec<any>>
  private _maxContentSize: number

  constructor(keys: PrivateKeyBundle, apiClient: ApiClient) {
    this.contacts = new Set<string>()
    this.knownPublicKeyBundles = new Map<string, PublicKeyBundle>()
    this.keys = keys
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
    return client.keys.encode()
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
  private async publishUserContact(): Promise<void> {
    const pub = this.keys.getPublicKeyBundle()
    await this.publishEnvelope({
      contentTopic: buildUserContactTopic(this.address),
      message: pub.toBytes(),
    })
  }

  // retrieve a key bundle from given user's contact topic
  async getUserContactFromNetwork(
    peerAddress: string
  ): Promise<PublicKeyBundle | undefined> {
    // have to avoid undefined to not trip TS's strictNullChecks on recipientKey
    let recipientKey: PublicKeyBundle | null = null
    const stream = this.apiClient.queryIterator(
      { contentTopics: [buildUserContactTopic(peerAddress)] },
      { pageSize: 5 }
    )

    for await (const env of stream) {
      if (!env.message) continue
      const bundle = ContactBundle.fromBytes(b64Decode(env.message.toString()))
      const keyBundle = bundle.keyBundle

      const address = keyBundle?.walletSignatureAddress()
      if (address === peerAddress) {
        recipientKey = keyBundle
        break
      }
    }
    return recipientKey === null ? undefined : recipientKey
  }

  /**
   * Returns the cached PublicKeyBundle if one is known for the given address or fetches
   * one from the network
   */

  async getUserContact(
    peerAddress: string
  ): Promise<PublicKeyBundle | undefined> {
    const existingBundle = this.knownPublicKeyBundles.get(peerAddress)

    if (existingBundle) {
      return existingBundle
    }

    const newBundle = await this.getUserContactFromNetwork(peerAddress)

    if (newBundle) {
      this.knownPublicKeyBundles.set(peerAddress, newBundle)
    }

    return newBundle
  }

  /**
   * Check if @peerAddress can be messaged, specifically it checks that a PublicKeyBundle can be
   * found for the given address
   */
  public async canMessage(peerAddress: string): Promise<boolean> {
    const keyBundle = await this.getUserContact(peerAddress)
    return keyBundle !== undefined
  }

  /**
   * Send a message to the wallet identified by @peerAddress
   */
  async sendMessage(
    peerAddress: string,
    content: any,
    options?: SendOptions
  ): Promise<Message> {
    let topics: string[]
    const recipient = await this.getUserContact(peerAddress)
    if (!recipient) {
      throw new Error(`recipient ${peerAddress} is not registered`)
    }

    if (!this.contacts.has(peerAddress)) {
      topics = [
        buildUserIntroTopic(peerAddress),
        buildDirectMessageTopic(this.address, peerAddress),
      ]
      if (peerAddress !== this.address) {
        topics.push(buildUserIntroTopic(this.address))
      }
      this.contacts.add(peerAddress)
    } else {
      topics = [buildDirectMessageTopic(this.address, peerAddress)]
    }
    const timestamp = options?.timestamp || new Date()
    const msg = await this.encodeMessage(recipient, timestamp, content, options)
    const msgBytes = msg.toBytes()

    await Promise.all(
      topics.map(async (topic) => {
        return this.publishEnvelope({
          contentTopic: topic,
          message: msgBytes,
        })
      })
    )

    return this.decodeMessage(msgBytes, topics[0])
  }

  async publishEnvelope(env: messageApi.Envelope): Promise<void> {
    const bytes = env.message
    if (!env.contentTopic) {
      throw new Error('Missing content topic')
    }

    if (!bytes || !bytes.length) {
      throw new Error('Cannot publish empty message')
    }

    try {
      await this.apiClient.publish([
        {
          contentTopic: env.contentTopic,
          message: bytes,
        },
      ])
    } catch (err) {
      console.log(err)
    }
  }

  registerCodec(codec: ContentCodec<any>): void {
    const id = codec.contentType
    const key = `${id.authorityId}/${id.typeId}`
    this._codecs.set(key, codec)
  }

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

  async encodeMessage(
    recipient: PublicKeyBundle,
    timestamp: Date,
    content: any,
    options?: SendOptions
  ): Promise<Message> {
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
    const payload = xmtpEnvelope.EncodedContent.encode(encoded).finish()
    return Message.encode(this.keys, recipient, payload, timestamp)
  }

  async decodeMessage(
    payload: Uint8Array,
    contentTopic: string | undefined
  ): Promise<Message> {
    const message = await Message.decode(this.keys, payload)
    if (message.error) {
      return message
    }
    if (!message.decrypted) {
      throw new Error('decrypted bytes missing')
    }
    const encoded = xmtpEnvelope.EncodedContent.decode(message.decrypted)
    await decompress(encoded, this._maxContentSize)
    if (!encoded.type) {
      throw new Error('missing content type')
    }
    const contentType = new ContentTypeId(encoded.type)
    const codec = this.codecFor(contentType)
    message.contentTopic = contentTopic
    if (codec) {
      message.content = codec.decode(encoded as EncodedContent, this)
      message.contentType = contentType
    } else {
      message.error = new Error('unknown content type ' + contentType)
      if (encoded.fallback) {
        message.content = encoded.fallback
        message.contentType = ContentTypeFallback
      }
    }
    return message
  }

  streamIntroductionMessages(): Promise<Stream<Message>> {
    return Stream.create<Message>(
      this,
      [buildUserIntroTopic(this.address)],
      noTransformation
    )
  }

  streamConversationMessages(peerAddress: string): Promise<Stream<Message>> {
    const topics = [buildDirectMessageTopic(peerAddress, this.address)]
    return Stream.create<Message>(
      this,
      topics,
      noTransformation,
      filterForTopics(topics)
    )
  }

  // list stored messages from this wallet's introduction topic
  listIntroductionMessages(opts?: ListMessagesOptions): Promise<Message[]> {
    return this.listMessages(buildUserIntroTopic(this.address), opts)
  }

  // list stored messages from conversation topic with the peer
  listConversationMessages(
    peerAddress: string,
    opts?: ListMessagesOptions
  ): Promise<Message[]> {
    return this.listMessages(
      buildDirectMessageTopic(peerAddress, this.address),
      { ...opts, checkAddresses: true }
    )
  }

  // list stored messages from the specified topic
  private async listMessages(
    topic: string,
    opts?: ListMessagesOptions
  ): Promise<Message[]> {
    if (!opts) {
      opts = {}
    }
    const { startTime, endTime, checkAddresses, limit } = opts

    const res = await this.apiClient.query(
      { contentTopics: [topic], startTime, endTime },
      {
        direction: messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
        limit,
      }
    )

    let msgs: Message[] = []
    for (const env of res) {
      if (!env.message) continue
      try {
        const msg = await this.decodeMessage(
          b64Decode(env.message as unknown as string),
          env.contentTopic
        )
        msgs.push(msg)
      } catch (e) {
        console.log(e)
      }
    }
    if (checkAddresses) {
      msgs = msgs.filter(filterForTopics([topic]))
    }
    return msgs
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

    case KeyStoreType.localStorage:
      if (!wallet) {
        throw new Error('Must provide a wallet for localStorageStore')
      }
      return createLocalPrivateKeyStore(wallet)

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
): EncryptedStore {
  return new EncryptedStore(wallet, new PrivateTopicStore(apiClient))
}

// Create Encrypted store which uses LocalStorage to store KeyBundles
function createLocalPrivateKeyStore(wallet: Signer): EncryptedStore {
  return new EncryptedStore(wallet, new LocalStorageStore())
}

function createStaticStore(privateKeyOverride: Uint8Array): KeyStore {
  return new StaticKeyStore(privateKeyOverride)
}

// attempt to load pre-existing key bundle from storage,
// otherwise create new key-bundle, store it and return it
async function loadOrCreateKeysFromStore(
  wallet: Signer | null,
  store: KeyStore
): Promise<PrivateKeyBundle> {
  let keys = await store.loadPrivateKeyBundle()
  if (keys) {
    return keys
  }
  if (!wallet) {
    throw new Error('No wallet found')
  }
  keys = await PrivateKeyBundle.generate(wallet)
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

// Ensure the message didn't have a spoofed address
function filterForTopics(topics: string[]): MessageFilter {
  return (msg) => {
    const senderAddress = msg.senderAddress
    const recipientAddress = msg.recipientAddress
    return (
      senderAddress !== undefined &&
      recipientAddress !== undefined &&
      topics.includes(buildDirectMessageTopic(senderAddress, recipientAddress))
    )
  }
}

function createApiClientFromOptions(options: ClientOptions): ApiClient {
  const apiUrl = options.apiUrl || ApiUrls[options.env]
  return new ApiClient(apiUrl)
}
