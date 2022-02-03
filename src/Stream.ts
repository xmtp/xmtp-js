import { WakuMessage } from 'js-waku'
import { Message } from '.'
import Client from './Client'

export default class Stream {
  messages: WakuMessage[]
  resolvers: ((value: IteratorResult<Message>) => void)[]
  topic: string
  client: Client
  callback: (wakuMsg: WakuMessage) => void

  constructor(client: Client, topic: string) {
    this.messages = []
    this.resolvers = []
    this.topic = topic
    this.client = client
    this.callback = async (wakuMsg: WakuMessage) => {
      if (!wakuMsg.payload) {
        return
      }
      const resolver = this.resolvers.pop()
      if (resolver) {
        const msg = await Message.decode(this.client.keys, wakuMsg.payload)
        resolver({ value: msg })
      } else {
        this.messages.unshift(wakuMsg)
      }
    }
    client.waku.relay.addObserver(this.callback, [topic])
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<Message> {
    return this
  }

  async return(): Promise<IteratorResult<Message>> {
    this.client.waku.relay.deleteObserver(this.callback, [this.topic])
    this.resolvers.forEach((resolve) =>
      resolve({ value: undefined, done: true })
    )
    return { value: undefined, done: true }
  }

  next(): Promise<IteratorResult<Message>> {
    const wakuMsg = this.messages.pop()
    if (wakuMsg?.payload) {
      return Message.decode(this.client.keys, wakuMsg.payload).then((msg) => {
        return { value: msg }
      })
    }
    return new Promise((resolve) => this.resolvers.unshift(resolve))
  }
}
