import { Waku, WakuMessage, PageDirection } from 'js-waku'
import { BootstrapOptions } from 'js-waku/build/main/lib/discovery'
import fetch from 'cross-fetch'
import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import Message from './Message'
import {
  buildDirectMessageTopic,
  buildUserContactTopic,
  buildUserIntroTopic,
  promiseWithTimeout,
} from './utils'
import { sleep } from '../test/helpers'
import Stream, { messageStream } from './Stream'
import { Signer } from 'ethers'
import { EncryptedStore, LocalStorageStore, PrivateTopicStore } from './store'
import { Conversations } from './conversations'
import {
  ContentTypeId,
  EncodedContent,
  ContentCodec,
  ContentTypeText,
  TextCodec,
  decompress,
  compress,
  ContentTypeFallback,
} from './MessageContent'
import { Compression } from './proto/messaging'
import * as proto from './proto/messaging'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

const NODES_LIST_URL = 'https://nodes.xmtp.com/'

type Nodes = { [k: string]: string }

type NodesList = {
  testnet: Nodes
}

// Default maximum allowed content size
const MaxContentSize = 100 * 1024 * 1024 // 100M

// Parameters for the listMessages functions
export type ListMessagesOptions = {
  pageSize?: number
  startTime?: Date
  endTime?: Date
}

export enum KeyStoreType {
  networkTopicStoreV1,
  localStorage,
}

// Parameters for the send functions
export { Compression }
export type SendOptions = {
  contentType: ContentTypeId
  contentFallback?: string
  compression?: Compression
}

/**
 * Network startup options
 */
type NetworkOptions = {
  /** List of multiaddrs for boot nodes */
  bootstrapAddrs?: string[]
  // Allow for specifying different envs later
  env: keyof NodesList
  /**
   * How long we should wait for the initial peer connection
   * to declare the startup as successful or failed
   */
  waitForPeersTimeoutMs: number
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
    env: 'testnet',
    waitForPeersTimeoutMs: 10000,
    codecs: [new TextCodec()],
    maxContentSize: MaxContentSize,
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
  waku: Waku
  address: string
  keys: PrivateKeyBundle
  private contacts: Set<string> // address which we have connected to
  private knownPublicKeyBundles: Map<string, PublicKeyBundle> // addresses and key bundles that we have witnessed
  private _conversations: Conversations
  private _codecs: Map<string, ContentCodec<any>>
  private _maxContentSize: number

  constructor(waku: Waku, keys: PrivateKeyBundle) {
    this.waku = waku
    this.contacts = new Set<string>()
    this.knownPublicKeyBundles = new Map<string, PublicKeyBundle>()
    this.keys = keys
    this.address = keys.identityKey.publicKey.walletSignatureAddress()
    this._conversations = new Conversations(this)
    this._codecs = new Map()
    this._maxContentSize = MaxContentSize
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
    wallet: Signer,
    opts?: Partial<ClientOptions>
  ): Promise<Client> {
    const options = defaultOptions(opts)
    const waku = await createWaku(options)
    const keyStore = createKeyStoreFromConfig(options, wallet, waku)
    const keys = await loadOrCreateKeys(wallet, keyStore)
    const client = new Client(waku, keys)
    options.codecs.forEach((codec) => {
      client.registerCodec(codec)
    })
    client._maxContentSize = options.maxContentSize
    await client.publishUserContact()
    return client
  }

  // gracefully shut down the client
  async close(): Promise<void> {
    return this.waku.stop()
  }

  // publish the key bundle into the contact topic
  private async publishUserContact(): Promise<void> {
    const pub = this.keys.getPublicKeyBundle()
    await this.waku.relay.send(
      await WakuMessage.fromBytes(
        pub.toBytes(),
        buildUserContactTopic(this.address)
      )
    )
  }

  // retrieve a key bundle from given user's contact topic
  async getUserContactFromNetwork(
    peerAddress: string
  ): Promise<PublicKeyBundle | undefined> {
    const recipientKeys = (
      await this.waku.store.queryHistory([buildUserContactTopic(peerAddress)], {
        pageSize: 1,
        pageDirection: PageDirection.BACKWARD,
        callback: () => true,
      })
    )
      .filter((msg: WakuMessage) => msg.payload)
      .map((msg: WakuMessage) =>
        PublicKeyBundle.fromBytes(msg.payload as Uint8Array)
      )
    return recipientKeys.length > 0 ? recipientKeys[0] : undefined
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
  ): Promise<void> {
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
    const timestamp = new Date()
    const msg = await this.encodeMessage(recipient, timestamp, content, options)
    await Promise.all(
      topics.map(async (topic) => {
        const wakuMsg = await WakuMessage.fromBytes(msg.toBytes(), topic, {
          timestamp,
        })
        return this.sendWakuMessage(wakuMsg)
      })
    )
  }

  private async sendWakuMessage(msg: WakuMessage): Promise<void> {
    const ack = await this.waku.lightPush.push(msg)
    if (ack?.isSuccess === false) {
      throw new Error(`Failed to send message with error: ${ack?.info}`)
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
    const payload = proto.EncodedContent.encode(encoded).finish()
    return Message.encode(this.keys, recipient, payload, timestamp)
  }

  async decodeMessage(payload: Uint8Array): Promise<Message> {
    const message = await Message.decode(this.keys, payload)
    if (message.error) {
      return message
    }
    if (!message.decrypted) {
      throw new Error('decrypted bytes missing')
    }
    const encoded = proto.EncodedContent.decode(message.decrypted)
    await decompress(encoded, this._maxContentSize)
    if (!encoded.type) {
      throw new Error('missing content type')
    }
    const contentType = new ContentTypeId(encoded.type)
    const codec = this.codecFor(contentType)
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

  streamIntroductionMessages(): Stream<Message> {
    return this.streamMessages(buildUserIntroTopic(this.address))
  }

  streamConversationMessages(peerAddress: string): Stream<Message> {
    return this.streamMessages(
      buildDirectMessageTopic(peerAddress, this.address)
    )
  }

  private streamMessages(topic: string): Stream<Message> {
    return messageStream(this, topic)
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
      opts
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
    if (!opts.startTime) {
      opts.startTime = new Date()
      opts.startTime.setTime(Date.now() - 1000 * 60 * 60 * 24 * 7)
    }
    if (!opts.endTime) {
      opts.endTime = new Date(new Date().toUTCString())
    }
    if (!opts.pageSize) {
      opts.pageSize = 10
    }

    const wakuMsgs = await this.waku.store.queryHistory([topic], {
      pageSize: opts.pageSize,
      pageDirection: PageDirection.FORWARD,
      timeFilter: {
        startTime: opts.startTime,
        endTime: opts.endTime,
      },
    })

    return Promise.all(
      wakuMsgs
        .filter((wakuMsg) => wakuMsg?.payload)
        .map(async (wakuMsg) =>
          this.decodeMessage(wakuMsg.payload as Uint8Array)
        )
    )
  }
}

function createKeyStoreFromConfig(
  opts: KeyStoreOptions,
  wallet: Signer,
  waku: Waku
): EncryptedStore {
  switch (opts.keyStoreType) {
    case KeyStoreType.networkTopicStoreV1:
      return createNetworkPrivateKeyStore(wallet, waku)

    case KeyStoreType.localStorage:
      return createLocalPrivateKeyStore(wallet)
  }
}

// Create Encrypted store which uses the Network to store KeyBundles
function createNetworkPrivateKeyStore(
  wallet: Signer,
  waku: Waku
): EncryptedStore {
  return new EncryptedStore(wallet, new PrivateTopicStore(waku))
}

// Create Encrypted store which uses LocalStorage to store KeyBundles
function createLocalPrivateKeyStore(wallet: Signer): EncryptedStore {
  return new EncryptedStore(wallet, new LocalStorageStore())
}

// attempt to load pre-existing key bundle from storage,
// otherwise create new key-bundle, store it and return it
async function loadOrCreateKeys(
  wallet: Signer,
  store: EncryptedStore
): Promise<PrivateKeyBundle> {
  let keys = await store.loadPrivateKeyBundle()
  if (keys) {
    return keys
  }
  keys = await PrivateKeyBundle.generate(wallet)
  await store.storePrivateKeyBundle(keys)
  return keys
}

// initialize connection to the network
export async function createWaku({
  bootstrapAddrs,
  env,
  waitForPeersTimeoutMs,
}: NetworkOptions): Promise<Waku> {
  const bootstrap: BootstrapOptions = bootstrapAddrs?.length
    ? {
        peers: bootstrapAddrs,
      }
    : {
        getPeers: () => getNodeList(env),
      }
  const waku = await Waku.create({
    libp2p: {
      config: {
        pubsub: {
          enabled: true,
          emitSelf: true,
        },
      },
    },
    bootstrap,
  })

  // Wait for peer connection.
  try {
    await promiseWithTimeout(
      waitForPeersTimeoutMs,
      () => waku.waitForRemotePeer(),
      'timeout connecting to peers'
    )
  } catch (err) {
    await waku.stop()
    throw err
  }
  // There's a race happening here even with waitForConnectedPeer; waiting
  // a few ms seems to be enough, but it would be great to fix this upstream.
  await sleep(200)
  return waku
}

async function getNodeList(env: keyof NodesList): Promise<string[]> {
  const res = await fetch(NODES_LIST_URL)
  const nodesList: NodesList = await res.json()

  return Object.values(nodesList[env])
}
