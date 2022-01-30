import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import { Waku, WakuMessage, PageDirection } from 'js-waku'
import Message from './Message'
import {
  buildContentTopic,
  buildDirectMessageTopic,
  buildPublicKeyBundleTopic,
  promiseWithTimeout,
} from './utils'
import { sleep } from '../test/helpers'
import Stream from './Stream'

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

  constructor(waku: Waku) {
    this.waku = waku
  }

  static async create(opts?: CreateOptions): Promise<Client> {
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

    return new Client(waku)
  }

  async close(): Promise<void> {
    return this.waku.stop()
  }

  async registerPublicKeyBundle(recipient: PublicKeyBundle): Promise<void> {
    if (!recipient.identityKey) {
      throw new Error('missing recipient')
    }
    await this.waku.relay.send(
      await WakuMessage.fromBytes(
        recipient.toBytes(),
        buildContentTopic(
          `keys-${recipient.identityKey.walletSignatureAddress()}`
        )
      )
    )
  }

  async getPublicKeyBundle(
    recipientWalletAddr: string
  ): Promise<PublicKeyBundle | undefined> {
    const recipientKeys = (
      await this.waku.store.queryHistory(
        [buildPublicKeyBundleTopic(recipientWalletAddr)],
        {
          pageSize: 1,
          pageDirection: PageDirection.BACKWARD,
        }
      )
    )
      .filter((msg: WakuMessage) => msg.payload)
      .map((msg: WakuMessage) =>
        PublicKeyBundle.fromBytes(msg.payload as Uint8Array)
      )
    return recipientKeys.length > 0 ? recipientKeys[0] : undefined
  }

  async sendMessage(
    sender: PrivateKeyBundle,
    recipient: PublicKeyBundle,
    msgString: string
  ): Promise<void> {
    if (!sender?.identityKey) {
      throw new Error('missing sender')
    }
    if (!recipient?.identityKey) {
      throw new Error('missing recipient')
    }
    const contentTopic = buildDirectMessageTopic(
      sender.identityKey.publicKey.walletSignatureAddress(),
      recipient.identityKey.walletSignatureAddress()
    )
    const timestamp = new Date()
    const msg = await Message.encode(sender, recipient, msgString, timestamp)
    const wakuMsg = await WakuMessage.fromBytes(msg.toBytes(), contentTopic, {
      timestamp,
    })
    return this.waku.relay.send(wakuMsg)
  }

  streamMessages(
    senderWalletAddr: string,
    recipient: PrivateKeyBundle
  ): Stream {
    return new Stream(this.waku, senderWalletAddr, recipient)
  }

  async listMessages(
    senderWalletAddr: string,
    recipient: PrivateKeyBundle,
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

    if (!recipient.identityKey) {
      throw new Error('missing recipient')
    }

    const contentTopic = buildDirectMessageTopic(
      senderWalletAddr,
      recipient.identityKey.publicKey.walletSignatureAddress()
    )
    const wakuMsgs = await this.waku.store.queryHistory([contentTopic], {
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
          Message.decode(recipient, wakuMsg.payload as Uint8Array)
        )
    )
  }
}
