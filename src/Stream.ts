import { UnsubscribeFn } from './ApiClient'
import Client from './Client'
import { messageApi } from '@xmtp/proto'

export type MessageDecoder<M> = (
  env: messageApi.Envelope
) => Promise<M | undefined>

export type ContentTopicUpdater<M> = (msg: M) => string[] | undefined

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
  callback: ((env: messageApi.Envelope) => Promise<void>) | undefined

  unsubscribeFn?: UnsubscribeFn

  constructor(
    client: Client,
    topics: string[],
    decoder: MessageDecoder<T>,
    contentTopicUpdater?: ContentTopicUpdater<T>
  ) {
    this.messages = []
    this.resolvers = []
    this.topics = topics
    this.client = client
    this.callback = this.newMessageCallback(decoder, contentTopicUpdater)
  }

  // returns new closure to handle incoming messages
  private newMessageCallback(
    decoder: MessageDecoder<T>,
    contentTopicUpdater?: ContentTopicUpdater<T>
  ): (env: messageApi.Envelope) => Promise<void> {
    return async (env: messageApi.Envelope) => {
      if (!env.message) {
        return
      }
      try {
        const msg = await decoder(env)
        // decoder can return undefined to signal a message to ignore/skip.
        if (!msg) {
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
          resolver({ value: msg })
        } else {
          // no, push the message into the queue
          this.messages.unshift(msg)
        }
      } catch (e) {
        console.warn(e)
      }
    }
  }

  private async start(): Promise<void> {
    if (!this.callback) {
      throw new Error('Missing callback for stream')
    }

    this.unsubscribeFn = this.client.apiClient.subscribe(
      {
        contentTopics: this.topics,
      },
      async (env: messageApi.Envelope) => {
        if (!this.callback) return
        await this?.callback(env)
      }
    )
  }

  static async create<T>(
    client: Client,
    topics: string[],
    decoder: MessageDecoder<T>,
    contentTopicUpdater?: ContentTopicUpdater<T>
  ): Promise<Stream<T>> {
    const stream = new Stream(client, topics, decoder, contentTopicUpdater)
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
    if (this.unsubscribeFn) {
      await this.unsubscribeFn()
    }
    if (!this.callback) {
      return { value: undefined, done: true }
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
    this.unsubscribeFn = this.client.apiClient.subscribe(
      {
        contentTopics: this.topics,
      },
      async (env: messageApi.Envelope) => {
        if (!this.callback) return
        await this?.callback(env)
      }
    )
  }
}
