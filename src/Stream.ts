import { WakuMessage } from 'js-waku'
import { Message } from '.'
import asyncify from 'callback-to-async-iterator'
import Client from './Client'

export default class Stream {
  iterator: AsyncIterableIterator<Message>

  constructor(client: Client, topic: string) {
    this.iterator = asyncify<Message>(
      async (callback) => {
        client.waku.relay.addObserver(
          async (wakuMsg: WakuMessage) => {
            if (wakuMsg.payload) {
              const msg = await Message.decode(client.keys, wakuMsg.payload)
              callback(msg)
            }
          },
          [topic]
        )
      },
      {
        onClose: () => client.waku.relay.deleteObserver(() => ({}), [topic]),
      }
    )
  }

  async next(): Promise<Message> {
    return (await this.iterator.next()).value
  }
}
