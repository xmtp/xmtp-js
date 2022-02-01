import { Waku, WakuMessage } from 'js-waku'
import { Message } from '.'
import asyncify from 'callback-to-async-iterator'
import { PrivateKeyBundle } from './crypto'
import { buildDirectMessageTopic } from './utils'

export default class Stream {
  iterator: AsyncIterableIterator<Message>

  constructor(
    waku: Waku,
    senderWalletAddr: string,
    recipientWalletAddr: string,
    decoder: PrivateKeyBundle
  ) {
    if (!decoder.identityKey) {
      throw new Error('invalid recipient key')
    }
    const decoderWalletAddr =
      decoder.identityKey.publicKey.walletSignatureAddress()

    const contentTopic =
      decoderWalletAddr === recipientWalletAddr
        ? buildDirectMessageTopic(recipientWalletAddr, senderWalletAddr)
        : buildDirectMessageTopic(senderWalletAddr, recipientWalletAddr)

    this.iterator = asyncify<Message>(
      async (callback) => {
        waku.relay.addObserver(
          async (wakuMsg: WakuMessage) => {
            if (wakuMsg.payload) {
              const msg = await Message.decode(decoder, wakuMsg.payload)
              callback(msg)
            }
          },
          [contentTopic]
        )
      },
      {
        onClose: () => waku.relay.deleteObserver(() => ({}), [contentTopic]),
      }
    )
  }

  async next(): Promise<Message> {
    return (await this.iterator.next()).value
  }
}
