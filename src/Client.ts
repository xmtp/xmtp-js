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
import { EncryptedStore, LocalStorageStore } from './store'
import { Conversations } from './conversations'
import {
  ContentTypeId,
  EncodedContent,
  MessageContent,
  ContentEncoder,
  ContentTypeText,
  TextContentEncoder,
  AlternativeContentDescription,
} from './MessageContent'
import * as proto from './proto/messaging'

const NODES_LIST_URL = 'https://nodes.xmtp.com/'

type Nodes = { [k: string]: string }

type NodesList = {
  testnet: Nodes
}

// Parameters for the listMessages functions
export type ListMessagesOptions = {
  pageSize?: number
  startTime?: Date
  endTime?: Date
}

/**
 * Network startup options
 */
export type CreateOptions = {
  /** List of multiaddrs for boot nodes */
  bootstrapAddrs?: string[]
  // Allow for specifying different envs later
  env?: keyof NodesList
  /**
   * How long we should wait for the initial peer connection
   * to declare the startup as successful or failed
   */
  waitForPeersTimeoutMs?: number
  // Allow configuring encoders for additional content types
  encoders?: ContentEncoder<any>[]
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
  private _encoders: Map<string, ContentEncoder<any>>

  constructor(waku: Waku, keys: PrivateKeyBundle) {
    this.waku = waku
    this.contacts = new Set<string>()
    this.knownPublicKeyBundles = new Map<string, PublicKeyBundle>()
    this.keys = keys
    this.address = keys.identityKey.publicKey.walletSignatureAddress()
    this._conversations = new Conversations(this)
    this._encoders = new Map()
    this.registerDefaultEncoders()
  }

  private registerDefaultEncoders(): void {
    this.registerEncoder(new TextContentEncoder())
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
  static async create(wallet: Signer, opts?: CreateOptions): Promise<Client> {
    const waku = await createWaku(opts || {})
    const keys = await loadOrCreateKeys(wallet)
    const client = new Client(waku, keys)
    opts?.encoders?.forEach((encoder) => {
      client.registerEncoder(encoder)
    })
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
    message: MessageContent
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
    const msg = await this.encodeMessage(recipient, message, timestamp)
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

  registerEncoder(encoder: ContentEncoder<any>): void {
    const id = encoder.contentType
    const key = `${id.authorityId}/${id.typeId}`
    this._encoders.set(key, encoder)
  }

  encoderFor(contentType: ContentTypeId): ContentEncoder<any> | undefined {
    const key = `${contentType.authorityId}/${contentType.typeId}`
    return this._encoders.get(key)
  }

  encodeMessage(
    recipient: PublicKeyBundle,
    content: MessageContent,
    timestamp: Date
  ): Promise<Message> {
    const contentType =
      typeof content === 'string' ? ContentTypeText : content.contentType
    const encoder = this.encoderFor(contentType)
    if (!encoder) {
      throw new Error(`unknown content type ${contentType}`)
    }
    const encoded = encoder.encode(content)
    const payload = proto.EncodedContent.encode(encoded).finish()
    return Message.encode(this.keys, recipient, payload, timestamp)
  }

  async decodeMessage(payload: Uint8Array): Promise<Message> {
    const message = await Message.decode(this.keys, payload)
    if (message.error) {
      return message
    }
    const encoded = proto.EncodedContent.decode(message.decrypted as Uint8Array)
    if (!encoded.contentType) {
      throw new Error('missing content type')
    }
    const encoder = this.encoderFor(encoded.contentType)
    if (encoder) {
      message.content = encoder.decode(
        encoded as EncodedContent
      ) as MessageContent
    } else {
      message.error = new Error(`unknown content type ${encoded.contentType}`)
      if (encoded.contentFallback) {
        message.content = new AlternativeContentDescription(
          encoded.contentFallback
        )
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

// attempt to load pre-existing key bundle from storage,
// otherwise create new key-bundle, store it and return it
async function loadOrCreateKeys(wallet: Signer): Promise<PrivateKeyBundle> {
  const store = new EncryptedStore(wallet, new LocalStorageStore())
  let keys = await store.loadPrivateKeyBundle()
  if (keys) {
    return keys
  }
  keys = await PrivateKeyBundle.generate(wallet)
  await store.storePrivateKeyBundle(keys)
  return keys
}

// initialize connection to the network
async function createWaku({
  bootstrapAddrs,
  env = 'testnet',
  waitForPeersTimeoutMs,
}: CreateOptions): Promise<Waku> {
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
      waitForPeersTimeoutMs || 10000,
      () => waku.waitForConnectedPeer(),
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
