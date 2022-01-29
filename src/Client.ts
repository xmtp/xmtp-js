import { PublicKeyBundle, PrivateKeyBundle } from './crypto'
import {
  Waku,
  getNodesFromHostedJson,
  WakuMessage,
  PageDirection,
} from 'js-waku'
import Message from './Message'
import { buildContentTopic, promiseWithTimeout } from './utils'
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
    const bootstrap = opts?.bootstrapAddrs
      ? {
          peers: opts?.bootstrapAddrs,
        }
      : {
          getPeers: getNodesFromHostedJson.bind({}, [
            'fleets',
            'wakuv2.test',
            'waku-websocket',
          ]),
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
        opts?.waitForPeersTimeoutMs || 5000,
        () => waku.waitForConnectedPeer(),
        'timeout connecting to peers'
      )
    } catch (err) {
      await waku.stop()
      throw err
    }
    // There's a race happening here even with waitForConnectedPeer; waiting
    // a few ms seems to be enough, but it would be great to fix this upstream.
    await sleep(5)

    return new Client(waku)
  }

  async close(): Promise<void> {
    return this.waku.stop()
  }

  async sendMessage(
    sender: PrivateKeyBundle,
    recipient: PublicKeyBundle,
    msgString: string
  ): Promise<void> {
    if (!recipient?.identityKey) {
      throw new Error('missing recipient')
    }

    // TODO:(snormore): The topic depends on whether the sender has notified
    // the recipients requests/introductions topic yet; if not then it should
    // send to that topic.
    const contentTopic = buildContentTopic(
      recipient.identityKey.walletSignatureAddress()
    )

    const timestamp = new Date()
    const msg = await Message.encode(sender, recipient, msgString, timestamp)
    const wakuMsg = await WakuMessage.fromBytes(msg.toBytes(), contentTopic, {
      timestamp,
    })
    return this.waku.relay.send(wakuMsg)
  }

  streamMessages(recipient: PrivateKeyBundle): Stream {
    return new Stream(this.waku, recipient)
  }

  async listMessages(
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

    // TODO:(snormore): The user can retrieve messages for their
    // requests/introduction topic, or a conversation topic, so that needs to
    // be supported here.
    const contentTopic = buildContentTopic(
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
