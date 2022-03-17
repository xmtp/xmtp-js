import { WakuMessage } from 'js-waku'
import Message from './Message'
import Client from './Client'

export type MessageTransformer<T> = (msg: Message) => T

export type MessageFilter = (msg: Message) => boolean

/**
 * Stream implements an Asynchronous Iterable over messages received from a topic.
 * As such can be used with constructs like for-await-of, yield*, array destructing, etc.
 */
export default class Stream<T> {
  topic: string
  client: Client
  // queue of incoming Waku messages
  messages: T[]
  // queue of already pending Promises
  resolvers: ((value: IteratorResult<T>) => void)[]
  // cache the callback so that it can be properly deregistered in Waku
  // if callback is undefined the stream is closed
  callback: ((wakuMsg: WakuMessage) => Promise<void>) | undefined

  constructor(
    client: Client,
    topic: string,
    messageTransformer: MessageTransformer<T>,
    messageFilter?: MessageFilter
  ) {
    this.messages = []
    this.resolvers = []
    this.topic = topic
    this.client = client
    this.callback = this.newMessageCallback(messageTransformer, messageFilter)
    client.waku.relay.addObserver(this.callback, [topic])
  }

  // returns new closure to handle incoming Waku messages
  private newMessageCallback(
    transformer: MessageTransformer<T>,
    filter?: MessageFilter
  ): (wakuMsg: WakuMessage) => Promise<void> {
    return async (wakuMsg: WakuMessage) => {
      if (!wakuMsg.payload) {
        return
      }
      const msg = await Message.decode(this.client.keys, wakuMsg.payload)
      // If there is a filter on the stream, and the filter returns false, ignore the message
      if (filter && !filter(msg)) {
        return
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

  // To make Stream proper Async Iterable
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this
  }

  // return should be called if the interpreter detects that the stream won't be used anymore,
  // e.g. a for/of loop was exited via a break. It can also be called explicitly.
  // https://tc39.es/ecma262/#table-iterator-interface-optional-properties
  // Note that this means the Stream will be closed after it was used in a for-await-of or yield* or similar.
  async return(): Promise<IteratorResult<T>> {
    if (!this.callback) {
      return { value: undefined, done: true }
    }
    this.client.waku.relay.deleteObserver(this.callback, [this.topic])
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
}

const messageTransformer: MessageTransformer<Message> = (msg: Message) => msg

export const messageStream = (client: Client, topic: string): Stream<Message> =>
  new Stream<Message>(client, topic, messageTransformer)
