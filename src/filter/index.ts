import Libp2p from 'libp2p'
import { Peer, PeerId } from 'libp2p/src/peer-store'
import {
  getPeersForProtocol,
  selectRandomPeer,
} from 'js-waku/build/main/lib/select_peer'
import { DefaultPubSubTopic } from 'js-waku'
import { WakuMessage } from 'js-waku/build/main/lib/waku_message'
import FilterRPC from './FilterRPC'
import FilterStream from './FilterStream'
import Client from '../Client'

export const FilterCodec = '/xmtp/filter/1.0.0-beta1'

type FilterSubscriptionOpts = {
  topic?: string
  peerId?: PeerId
  contentTopics: string[]
}

type FilterCallback = (msg: WakuMessage) => void | Promise<void>

export class WakuFilter {
  private subscriptions: {
    [requestId: string]: FilterCallback
  }

  client: Client
  libp2p: Libp2p

  constructor(client: Client) {
    this.subscriptions = {}
    this.client = client
    this.libp2p = client.waku.libp2p
  }

  async subscribe(opts: FilterSubscriptionOpts): Promise<FilterStream> {
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
    return FilterStream.create(stream, request)
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
