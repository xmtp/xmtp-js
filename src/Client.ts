import fetch from 'cross-fetch'
import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import Message from './Message'
import {
  buildDirectMessageTopic,
  buildUserIntroTopic,
  publishUserContact,
} from './utils'
import Stream, { MessageFilter } from './Stream'
import { Signer } from 'ethers'
import { EncryptedStore, LocalStorageStore } from './store'
import { Conversations } from './conversations'
import { ContentTypeText, TextCodec } from './codecs/Text'
import {
  ContentTypeId,
  EncodedContent,
  ContentCodec,
  ContentTypeFallback,
} from './MessageContent'
import { decompress, compress } from './Compression'
import { Compression } from './proto/messaging'
import * as proto from './proto/messaging'
import ContactBundle from './ContactBundle'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'
import { queryClient, txClient } from './xmtp'
import { hexToBytes } from './crypto/utils'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

const NODES_LIST_URL = 'https://nodes.xmtp.com/'

type Nodes = { [k: string]: string }

type NodesList = {
  dev: Nodes
  production: Nodes
}

type Envelope = {
  topic: string
  message: Message
}

// Default maximum allowed content size
const MaxContentSize = 100 * 1024 * 1024 // 100M

// Parameters for the listMessages functions
export type ListMessagesOptions = {
  checkAddresses?: boolean
  pageSize?: number
}

export enum KeyStoreType {
  networkTopicStoreV1,
  localStorage,
}

// Parameters for the send functions
export { Compression }
export type SendOptions = {
  contentType?: ContentTypeId
  contentFallback?: string
  compression?: Compression
  timestamp?: Date
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
    env: 'dev',
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
  address: string
  keys: PrivateKeyBundle
  private contacts: Set<string> // address which we have connected to
  private knownPublicKeyBundles: Map<string, PublicKeyBundle> // addresses and key bundles that we have witnessed
  private _conversations: Conversations
  private _codecs: Map<string, ContentCodec<any>>
  private _maxContentSize: number

  constructor(keys: PrivateKeyBundle) {
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
    const keyStore = createKeyStoreFromConfig(options, wallet)
    const keys = await loadOrCreateKeys(wallet, keyStore)
    const client = new Client(keys)
    options.codecs.forEach((codec) => {
      client.registerCodec(codec)
    })
    client._maxContentSize = options.maxContentSize
    await client.publishUserContact()
    return client
  }

  // gracefully shut down the client
  async close(): Promise<void> {
    return undefined
  }

  // publish the key bundle into the contact topic
  private async publishUserContact(): Promise<void> {
    await publishUserContact(this.keys, this.address)
  }

  // retrieve a key bundle from given user's contact topic
  async getUserContactFromNetwork(
    peerAddress: string
  ): Promise<PublicKeyBundle | undefined> {
    let recipientKey: PublicKeyBundle | null = null

    const client = await queryClient({
      addr: process.env.XMTP_QUERY_URL || 'http://localhost:1317',
    })
    try {
      const res = await client.queryContact({
        id: peerAddress,
      })
      const bundle = ContactBundle.fromHex(res.data.contact?.bundle || '')
      const keyBundle = bundle.keyBundle

      const address = keyBundle?.walletSignatureAddress()
      if (address === peerAddress) {
        recipientKey = keyBundle
      }
    } catch (e) {
      console.error(e)
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
    msg.content = content
    const envs: Envelope[] = await Promise.all(
      topics.map((topic) => {
        return {
          topic: topic,
          message: msg,
        }
      })
    )
    setTimeout(async () => {
      try {
        await this.sendXmtpMessages(envs)
      } catch (e) {
        console.error(e)
      }
    }, 1)

    return msg
  }

  private async sendXmtpMessages(envs: Envelope[]): Promise<void> {
    const wallet = await DirectSecp256k1Wallet.fromKey(
      this.keys.identityKey.secp256k1?.bytes || new Uint8Array()
    )
    const client = await txClient(wallet, {
      addr: process.env.XMTP_TX_URL || 'http://localhost:26657',
    })
    const accountAddr = (await wallet.getAccounts())[0].address
    const createMsgs = envs.map((env) =>
      client.msgCreateMessage({
        actor: {
          account: accountAddr,
        },
        message: {
          id: env.message.id,
          topic: env.topic,
          updated_at: 0,
          created_at: 0,
          content: env.message.toHex(),
        },
      })
    )
    console.log('Sending messages', envs.length)
    // await client.signAndBroadcast(createMsgs)
    // TODO: figure out why sending multiple results in none being received
    for (const msg of createMsgs) {
      let shouldRetry = true
      while (shouldRetry) {
        try {
          await client.signAndBroadcast([msg])
          shouldRetry = false
        } catch (e) {
          if ((e as Error).toString().includes('incorrect account sequence')) {
            continue
          }
          shouldRetry = false
          console.error('sending message', e)
        }
      }
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

  streamIntroductionMessages(): Promise<Stream<Message>> {
    return Stream.create<Message>(
      this,
      buildUserIntroTopic(this.address),
      noTransformation
    )
  }

  streamConversationMessages(peerAddress: string): Promise<Stream<Message>> {
    const topic = buildDirectMessageTopic(peerAddress, this.address)
    return Stream.create<Message>(
      this,
      topic,
      noTransformation,
      filterForTopic(topic)
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
    if (!opts.pageSize) {
      opts.pageSize = 10
    }

    const client = await queryClient({
      addr: process.env.XMTP_QUERY_URL || 'http://localhost:1317',
    })
    console.log('querying for messages')
    const res = await client.queryMessages({
      topic,
      // 'pagination.reverse': true,
      'pagination.limit': opts.pageSize.toString(),
    })
    let msgs = await Promise.all(
      res.data.messages?.map((msg) =>
        this.decodeMessage(hexToBytes(msg.content || ''))
      ) || []
    )
    if (opts?.checkAddresses) {
      msgs = msgs.filter(filterForTopic(topic))
    }
    return msgs
  }
}

function createKeyStoreFromConfig(
  opts: KeyStoreOptions,
  wallet: Signer
): EncryptedStore {
  switch (opts.keyStoreType) {
    case KeyStoreType.networkTopicStoreV1:
      return createLocalPrivateKeyStore(wallet)
    // return createNetworkPrivateKeyStore(wallet)

    case KeyStoreType.localStorage:
      return createLocalPrivateKeyStore(wallet)
  }
}

// Create Encrypted store which uses the Network to store KeyBundles
// function createNetworkPrivateKeyStore(wallet: Signer): EncryptedStore {
//   return new EncryptedStore(wallet, new PrivateTopicStore())
// }

// Create Encrypted store which uses LocalStorage to store KeyBundles
function createLocalPrivateKeyStore(wallet: Signer): EncryptedStore {
  return new EncryptedStore(wallet, new LocalStorageStore())
}

// attempt to load pre-existing key bundle from storage,
// otherwise create new key-bundle, store it and return it
async function loadOrCreateKeys(
  signer: Signer,
  store: EncryptedStore
): Promise<PrivateKeyBundle> {
  let keys = await store.loadPrivateKeyBundle()
  if (keys) {
    return keys
  }
  keys = await PrivateKeyBundle.generate(signer)
  const wallet = await DirectSecp256k1Wallet.fromKey(
    keys.identityKey.secp256k1?.bytes || new Uint8Array()
  )
  const accounts = await wallet.getAccounts()
  const address = accounts[0].address
  console.log(address)
  // await fetch('http://localhost:4500', {
  //   method: 'POST',
  //   headers: {
  //     Accept: 'application/json',
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     address: address,
  //     coins: ['10token'],
  //   }),
  // })
  await store.storePrivateKeyBundle(keys)
  return keys
}

function noTransformation(msg: Message) {
  return msg
}

function filterForTopic(topic: string): MessageFilter {
  return (msg) => {
    const senderAddress = msg.senderAddress
    const recipientAddress = msg.recipientAddress
    return (
      senderAddress !== undefined &&
      recipientAddress !== undefined &&
      buildDirectMessageTopic(senderAddress, recipientAddress) === topic
    )
  }
}
