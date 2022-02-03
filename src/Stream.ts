import { WakuMessage } from 'js-waku'
import { Message } from '.'
import Client from './Client'

// Stream implements an Asynchronous Iterable over messages received from a topic.
// As such can be used with constructs like for-await-of, yield*, array destructing, etc.
export default class Stream {
  messages: Message[] // queue of incoming Waku messages
  resolvers: ((value: IteratorResult<Message>) => void)[] // queue of already pending Promises
  topic: string
  client: Client
  callback: (wakuMsg: WakuMessage) => void // caches the callback so that it can be properly deregistered in Waku

  constructor(client: Client, topic: string) {
    this.messages = []
    this.resolvers = []
    this.topic = topic
    this.client = client
    this.callback = async (wakuMsg: WakuMessage) => {
      if (!wakuMsg.payload) {
        return
      }
      const msg = await Message.decode(this.client.keys, wakuMsg.payload)
      // is there a Promise already pending?
      const resolver = this.resolvers.pop()
      if (resolver) {
        // yes, resolve it
        resolver({ value: msg })
      } else {
        // no, push the message into the queue
        this.messages.unshift(msg)
      }
    }
    client.waku.relay.addObserver(this.callback, [topic])
  }

  // To make Stream proper Async Iterable
  [Symbol.asyncIterator](): AsyncIterableIterator<Message> {
    return this
  }

  // return should be called if the interpreter detects that the stream won't be used anymore,
  // e.g. a for/of loop was exited via a break. It can also be called explicitly.
  // https://tc39.es/ecma262/#table-iterator-interface-optional-properties
  // Note that this means the Stream will be closed after it was used in a for-await-of or yield* or similar.
  async return(): Promise<IteratorResult<Message>> {
    this.client.waku.relay.deleteObserver(this.callback, [this.topic])
    this.resolvers.forEach((resolve) =>
      resolve({ value: undefined, done: true })
    )
    return { value: undefined, done: true }
  }

  // To make Stream proper Async Iterator
  // Note that next() will still provide whatever messages were already pending
  // even after the stream was closed via return().
  next(): Promise<IteratorResult<Message>> {
    // Is there a message already pending?
    const msg = this.messages.pop()
    if (msg) {
      // yes, return resolved promise
      return Promise.resolve({ value: msg })
    }
    // otherwise return empty Promise and queue its resolver
    return new Promise((resolve) => this.resolvers.unshift(resolve))
  }
}
