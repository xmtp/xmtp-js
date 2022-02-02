import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import { Waku, WakuMessage, PageDirection } from 'js-waku'
import Message from './Message'
import {
  buildDirectMessageTopic,
  buildUserContactTopic,
  buildUserIntroTopic,
  promiseWithTimeout,
} from './utils'
import { sleep } from '../test/helpers'
import Stream from './Stream'
import { Signer } from 'ethers'
import { EncryptedStore, LocalStorageStore } from './store'

type ListMessagesOptions = {
  pageSize?: number
  startTime?: Date
  endTime?: Date
}

type CreateOptions = {
  bootstrapAddrs?: string[]
  waitForPeersTimeoutMs?: number
}

export default class Client {
  waku: Waku
  keys: PrivateKeyBundle
  address: string
  contacts: Map<string, PublicKeyBundle> // addresses and key bundles that we already have connection with

  constructor(waku: Waku, keys: PrivateKeyBundle) {
    this.waku = waku
    this.contacts = new Map<string, PublicKeyBundle>()
    this.keys = keys
    this.address = keys.identityKey.publicKey.walletSignatureAddress()
  }

  static async create(wallet: Signer, opts?: CreateOptions): Promise<Client> {
    const waku = await createWaku(opts)
    const keys = await loadOrCreateKeys(wallet)
    const client = new Client(waku, keys)
    await client.publishUserContact()
    return client
  }

  async close(): Promise<void> {
    return this.waku.stop()
  }

  async publishUserContact(): Promise<void> {
    const pub = this.keys.getPublicKeyBundle()
    await this.waku.relay.send(
      await WakuMessage.fromBytes(
        pub.toBytes(),
        buildUserContactTopic(this.address)
      )
    )
  }

  async getUserContact(
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

  async sendMessage(peerAddress: string, msgString: string): Promise<void> {
    let topics: string[]
    let recipient = this.contacts.get(peerAddress)
    if (!recipient) {
      recipient = await this.getUserContact(peerAddress)
      if (!recipient) {
        throw new Error(`recipient ${peerAddress} is not registered`)
      }
      this.contacts.set(peerAddress, recipient)
      topics = [
        buildUserIntroTopic(peerAddress),
        buildUserIntroTopic(this.address),
        buildDirectMessageTopic(this.address, peerAddress),
      ]
    } else {
      topics = [buildDirectMessageTopic(this.address, peerAddress)]
    }
    const timestamp = new Date()
    const msg = await Message.encode(this.keys, recipient, msgString, timestamp)
    await Promise.all(
      topics.map(async (topic) => {
        const wakuMsg = await WakuMessage.fromBytes(msg.toBytes(), topic, {
          timestamp,
        })
        return this.waku.relay.send(wakuMsg)
      })
    )
  }

  streamIntroductionMessages(): Stream {
    return this.streamMessages(buildUserIntroTopic(this.address))
  }

  streamConversationMessages(peerAddress: string): Stream {
    return this.streamMessages(
      buildDirectMessageTopic(peerAddress, this.address)
    )
  }

  private streamMessages(topic: string): Stream {
    return new Stream(this, topic)
  }

  listIntroductionMessages(opts?: ListMessagesOptions): Promise<Message[]> {
    return this.listMessages(buildUserIntroTopic(this.address), opts)
  }

  listConversationMessages(
    peerAddress: string,
    opts?: ListMessagesOptions
  ): Promise<Message[]> {
    return this.listMessages(
      buildDirectMessageTopic(peerAddress, this.address),
      opts
    )
  }

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
          Message.decode(this.keys, wakuMsg.payload as Uint8Array)
        )
    )
  }
}

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

async function createWaku(opts?: CreateOptions): Promise<Waku> {
  if (!opts?.bootstrapAddrs) {
    throw new Error('missing bootstrap node addresses')
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
    bootstrap: {
      peers: opts?.bootstrapAddrs,
    },
  })

  // Wait for peer connection.
  try {
    await promiseWithTimeout(
      opts?.waitForPeersTimeoutMs || 10000,
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
