import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import { Waku, WakuMessage, PageDirection } from 'js-waku'
import Message from './Message'
import {
  buildDirectMessageTopic,
  buildUserContactTopic,
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

  async publishUserContact(recipient: PublicKeyBundle): Promise<void> {
    if (!recipient.identityKey) {
      throw new Error('missing recipient')
    }
    await this.waku.relay.send(
      await WakuMessage.fromBytes(
        recipient.toBytes(),
        buildUserContactTopic(recipient.identityKey.walletSignatureAddress())
      )
    )
  }

  async getUserContact(
    recipientWalletAddr: string
  ): Promise<PublicKeyBundle | undefined> {
    const recipientKeys = (
      await this.waku.store.queryHistory(
        [buildUserContactTopic(recipientWalletAddr)],
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

    const timestamp = new Date()
    const recipientWalletAddr = recipient.identityKey.walletSignatureAddress()
    const senderWalletAddr =
      sender.identityKey.publicKey.walletSignatureAddress()

    // Send to the recipient DM topic.
    const recipientMsg = await Message.encode(
      sender,
      recipient,
      {
        sender: sender.getPublicKeyBundle(),
        recipient,
        timestamp: timestamp.getTime(),
      },
      msgString
    )
    await this.waku.relay.send(
      await WakuMessage.fromBytes(
        recipientMsg.toBytes(),
        buildDirectMessageTopic(recipientWalletAddr, senderWalletAddr),
        {
          timestamp,
        }
      )
    )

    // If sender and recipient are the same, then we're done.
    if (senderWalletAddr === recipientWalletAddr) {
      return
    }

    // Send to the sender DM topic.
    const senderMsg = await Message.encode(
      sender,
      sender.getPublicKeyBundle(),
      {
        sender: sender.getPublicKeyBundle(),
        recipient,
        timestamp: timestamp.getTime(),
      },
      msgString
    )
    await this.waku.relay.send(
      await WakuMessage.fromBytes(
        senderMsg.toBytes(),
        buildDirectMessageTopic(senderWalletAddr, recipientWalletAddr),
        {
          timestamp,
        }
      )
    )
  }

  streamMessages(
    senderWalletAddr: string,
    recipientWalletAddr: string,
    decoder: PrivateKeyBundle
  ): Stream {
    return new Stream(this.waku, senderWalletAddr, recipientWalletAddr, decoder)
  }

  async listMessages(
    senderWalletAddr: string,
    recipientWalletAddr: string,
    decoder: PrivateKeyBundle,
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

    if (!decoder.identityKey) {
      throw new Error('missing recipient')
    }
    const decoderWalletAddr =
      decoder.identityKey.publicKey.walletSignatureAddress()

    const contentTopic =
      decoderWalletAddr === recipientWalletAddr
        ? buildDirectMessageTopic(recipientWalletAddr, senderWalletAddr)
        : buildDirectMessageTopic(senderWalletAddr, recipientWalletAddr)

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
          Message.decode(decoder, wakuMsg.payload as Uint8Array)
        )
    )
  }
}
