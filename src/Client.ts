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
import Stream from './Stream'
import { Signer } from 'ethers'
import { EncryptedStore, LocalStorageStore } from './store'

const NODES_LIST_URL = 'https://nodes.xmtp.com/'

type Nodes = { [k: string]: string }

type NodesList = {
  testnet: Nodes
}

// Parameters for the listMessages functions
type ListMessagesOptions = {
  pageSize?: number
  startTime?: Date
  endTime?: Date
}

// Network startup options
type CreateOptions = {
  // bootstrap node multiaddrs
  bootstrapAddrs?: string[]
  // Allow for specifying different envs later
  env?: keyof NodesList
  // how long should we wait for the initial peer connection
  // to declare the startup as successful or failed
  waitForPeersTimeoutMs?: number
}

// Client is the central hub of interaction with the network,
// most relevant functionality is accessed through methods on the Client.
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

  // create and start a client associated with given wallet;
  // create options specify how to to connect to the network
  static async create(wallet: Signer, opts?: CreateOptions): Promise<Client> {
    const waku = await createWaku(opts || {})
    const keys = await loadOrCreateKeys(wallet)
    const client = new Client(waku, keys)
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

  // send a message to the wallet identified by @peerAddress
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
        buildDirectMessageTopic(this.address, peerAddress),
      ]
      if (peerAddress !== this.address) {
        topics.push(buildUserIntroTopic(this.address))
      }
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

  // stream new messages from this wallet's introduction topic
  streamIntroductionMessages(): Stream {
    return this.streamMessages(buildUserIntroTopic(this.address))
  }

  // stream new messages from the conversion topic with the peer
  streamConversationMessages(peerAddress: string): Stream {
    return this.streamMessages(
      buildDirectMessageTopic(peerAddress, this.address)
    )
  }

  // stream new messages from the specified topic
  private streamMessages(topic: string): Stream {
    return new Stream(this, topic)
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
          Message.decode(this.keys, wakuMsg.payload as Uint8Array)
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
