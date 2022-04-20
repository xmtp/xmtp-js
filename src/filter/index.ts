import debug from 'debug'
import lp from 'it-length-prefixed'
import { pipe } from 'it-pipe'
import Libp2p from 'libp2p'
import { Peer, PeerId } from 'libp2p/src/peer-store'
import { WakuMessage as WakuMessageProto } from '../proto/waku/waku_message'
import {
  getPeersForProtocol,
  selectRandomPeer,
} from 'js-waku/build/main/lib/select_peer'
import { DefaultPubSubTopic } from 'js-waku'
import {
  DecryptionMethod,
  WakuMessage,
} from 'js-waku/build/main/lib/waku_message'
import { ContentFilter, FilterRPC } from './filter_rpc'

export const FilterCodec = '/vac/waku/filter/2.0.0-beta1'

const log = debug('waku:filter')

type FilterSubscriptionOpts = {
  topic?: string
  peerId?: PeerId
  contentTopics: string[]
}

type FilterCallback = (msg: WakuMessage) => void | Promise<void>

type UnsubscribeFunction = () => Promise<void>

export class WakuFilter {
  private subscriptions: {
    [requestId: string]: FilterCallback
  }

  public decryptionKeys: Map<
    Uint8Array,
    { method?: DecryptionMethod; contentTopics?: string[] }
  >

  constructor(public libp2p: Libp2p) {
    this.libp2p.handle(FilterCodec, this.onRequest.bind(this))
    this.subscriptions = {}
    this.decryptionKeys = new Map()
  }

  async subscribe(
    opts: FilterSubscriptionOpts,
    callback: FilterCallback
  ): Promise<UnsubscribeFunction> {
    const topic = opts.topic || DefaultPubSubTopic
    const contentFilters = opts.contentTopics.map((contentTopic) => ({
      contentTopic,
    }))
    const request = FilterRPC.createRequest(
      topic,
      contentFilters,
      undefined,
      true
    )
    const peer = await this.getPeer()
    const connection = this.libp2p.connectionManager.get(peer.id)
    if (!connection) {
      throw new Error('Failed to get a connection to the peer')
    }

    const { stream } = await connection.newStream(FilterCodec)
    try {
      await pipe([request.encode()], lp.encode(), stream.sink)
    } catch (e) {
      log('Error subscribing', e)
    }

    this.addCallback(request.requestId, callback)

    return async () => {
      await this.unsubscribe(topic, contentFilters, request.requestId, peer)
      this.removeCallback(request.requestId)
    }
  }

  private async onRequest({ stream }: Libp2p.HandlerProps): Promise<void> {
    log('Receiving message push')
    try {
      await pipe(
        stream.source,
        lp.decode(),
        async (source: AsyncIterable<Buffer>) => {
          for await (const bytes of source) {
            const res = FilterRPC.decode(bytes.slice())
            if (res.push?.messages?.length) {
              await this.pushMessages(res.requestId, res.push.messages)
            }
          }
        }
      )
    } catch (e) {
      log('Error decoding message', e)
    }
  }

  private async pushMessages(
    requestId: string,
    messages: WakuMessageProto[]
  ): Promise<void> {
    const callback = this.subscriptions[requestId]
    if (!callback) {
      console.warn(`No callback registered for request ID ${requestId}`)
      return
    }
    for (const message of messages) {
      const decoded = await WakuMessage.decodeProto(message, [])
      if (!decoded) {
        console.error('Not able to decode message')
        continue
      }
      callback(decoded)
    }
  }

  private addCallback(requestId: string, callback: FilterCallback): void {
    this.subscriptions[requestId] = callback
  }

  private removeCallback(requestId: string): void {
    delete this.subscriptions[requestId]
  }

  private async unsubscribe(
    topic: string,
    contentFilters: ContentFilter[],
    requestId: string,
    peer: Peer
  ): Promise<void> {
    const unsubscribeRequest = FilterRPC.createRequest(
      topic,
      contentFilters,
      requestId,
      false
    )
    const connection = this.libp2p.connectionManager.get(peer.id)
    if (!connection) {
      throw new Error('Failed to get a connection to the peer')
    }
    const { stream } = await connection.newStream(FilterCodec)
    try {
      await pipe([unsubscribeRequest.encode()], lp.encode(), stream.sink)
    } catch (e) {
      console.error('Error unsubscribing', e)
    }
  }

  private async getPeer(peerId?: PeerId): Promise<Peer> {
    let peer
    if (peerId) {
      peer = await this.libp2p.peerStore.get(peerId)
      if (!peer)
        throw new Error(
          `Failed to retrieve connection details for provided peer in peer store: ${peerId.toB58String()}`
        )
    } else {
      peer = await this.randomPeer
      if (!peer)
        throw new Error(
          'Failed to find known peer that registers waku filter protocol'
        )
    }
    return peer
  }

  get peers(): AsyncIterable<Peer> {
    return getPeersForProtocol(this.libp2p, [FilterCodec])
  }

  get randomPeer(): Promise<Peer | undefined> {
    return selectRandomPeer(this.peers)
  }
}
