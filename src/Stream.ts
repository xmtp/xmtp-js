import { WakuMessage } from 'js-waku'
import { Connection } from 'libp2p'
import Message from './Message'
import Client from './Client'
import { sleep } from './utils'

const DISCONNECT_LOOP_INTERVAL = 1000

export type MessageTransformer<T> = (msg: Message) => T

export type MessageFilter = (msg: Message) => boolean

export type ContentTopicUpdater = (msg: Message) => string[] | undefined

export const noTransformation = (msg: Message): Message => {
  return msg
}

/**
 * Stream implements an Asynchronous Iterable over messages received from a topic.
 * As such can be used with constructs like for-await-of, yield*, array destructing, etc.
 */
export default class Stream<T> {
  topics: string[]
  client: Client
  // queue of incoming Waku messages
  messages: T[]
  // queue of already pending Promises
  resolvers: ((value: IteratorResult<T>) => void)[]
  // cache the callback so that it can be properly deregistered in Waku
  // if callback is undefined the stream is closed
  callback: ((wakuMsg: WakuMessage) => Promise<void>) | undefined

  private _disconnectCallback?: (connection: Connection) => Promise<void>

  unsubscribeFn?: () => Promise<void>

  constructor(
    client: Client,
    topics: string[],
    messageTransformer: MessageTransformer<T>,
    messageFilter?: MessageFilter,
    contentTopicUpdater?: ContentTopicUpdater
  ) {
    this.messages = []
    this.resolvers = []
    this.topics = topics
    this.client = client
    this.callback = this.newMessageCallback(
      messageTransformer,
      messageFilter,
      contentTopicUpdater
    )
  }

  // returns new closure to handle incoming Waku messages
  private newMessageCallback(
    transformer: MessageTransformer<T>,
    filter?: MessageFilter,
    contentTopicUpdater?: ContentTopicUpdater
  ): (wakuMsg: WakuMessage) => Promise<void> {
    return async (wakuMsg: WakuMessage) => {
      if (!wakuMsg.payload) {
        return
      }
      const msg = await this.client.decodeMessage(
        wakuMsg.payload,
        wakuMsg.contentTopic
      )
      // If there is a filter on the stream, and the filter returns false, ignore the message
      if (filter && !filter(msg)) {
        return
      }
      // Check to see if we should update the stream's content topic subscription
      if (contentTopicUpdater) {
        const topics = contentTopicUpdater(msg)
        if (topics) {
          this.resubscribeToTopics(topics)
        }
      }
      // is there a Promise already pending?
      const resolver = this.resolvers.pop()
      if (resolver) {
        // yes, resolve it
        resolver({ value: transformer(msg) })
      } else {
        // no, push the message into the queue
        this.messages.unshift(transformer(msg))
      }
    }
  }

  private async start(): Promise<void> {
    if (!this.callback) {
      throw new Error('Missing callback for stream')
    }

    this.unsubscribeFn = await this.client.waku.filter.subscribe(
      this.callback,
      this.topics
    )
    await this.listenForDisconnect()
  }

  private async listenForDisconnect() {
    const peer = await this.client.waku.filter.randomPeer
    // Save the callback function on the class so we can clean up later
    this._disconnectCallback = async (connection: Connection) => {
      if (connection.remotePeer.toB58String() === peer?.id?.toB58String()) {
        console.log(`Connection to peer ${connection.remoteAddr} lost`)
        while (true) {
          try {
            if (!this.callback) {
              return
            }
            this.unsubscribeFn = await this.client.waku.filter.subscribe(
              this.callback,
              this.topics
            )
            console.log(`Connection to peer ${connection.remoteAddr} restored`)
            return
          } catch (e) {
            console.warn(`Error reconnecting to ${connection.remoteAddr}`)
            await sleep(DISCONNECT_LOOP_INTERVAL)
          }
        }
      }
    }

    this.client.waku.libp2p.connectionManager.on(
      'peer:disconnect',
      this._disconnectCallback
    )
  }

  static async create<T>(
    client: Client,
    topics: string[],
    messageTransformer: MessageTransformer<T>,
    messageFilter?: MessageFilter,
    contentTopicUpdater?: ContentTopicUpdater
  ): Promise<Stream<T>> {
    const stream = new Stream(
      client,
      topics,
      messageTransformer,
      messageFilter,
      contentTopicUpdater
    )
    await stream.start()
    return stream
  }

  // To make Stream proper Async Iterable
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this
  }

  // return should be called if the interpreter detects that the stream won't be used anymore,
  // e.g. a for/of loop was exited via a break. It can also be called explicitly.
  // https://tc39.es/ecma262/#table-iterator-interface-optional-properties
  // Note that this means the Stream will be closed after it was used in a for-await-of or yield* or similar.
  async return(): Promise<IteratorResult<T>> {
    if (this._disconnectCallback) {
      this.client.waku.libp2p.connectionManager.off(
        'peer:disconnect',
        this._disconnectCallback
      )
    }
    if (!this.callback) {
      return { value: undefined, done: true }
    }
    if (this.unsubscribeFn) {
      await this.unsubscribeFn()
    }
    this.callback = undefined
    this.resolvers.forEach((resolve) =>
      resolve({ value: undefined, done: true })
    )
    return { value: undefined, done: true }
  }

  // To make Stream proper Async Iterator
  // Note that next() will still provide whatever messages were already pending
  // even after the stream was closed via return().
  next(): Promise<IteratorResult<T>> {
    // Is there a message already pending?
    const msg = this.messages.pop()
    if (msg) {
      // yes, return resolved promise
      return Promise.resolve({ value: msg })
    }
    if (!this.callback) {
      return Promise.resolve({ value: undefined, done: true })
    }
    // otherwise return empty Promise and queue its resolver
    return new Promise((resolve) => this.resolvers.unshift(resolve))
  }

  // Unsubscribe from the existing content topics and resubscribe to the given topics.
  private async resubscribeToTopics(topics: string[]): Promise<void> {
    if (!this.callback || !this.unsubscribeFn) {
      throw new Error('Missing callback for stream')
    }
    await this.unsubscribeFn()
    this.topics = topics
    this.unsubscribeFn = await this.client.waku.filter.subscribe(
      this.callback,
      this.topics
    )
  }
}
