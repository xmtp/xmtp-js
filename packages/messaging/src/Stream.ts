import { Waku, WakuMessage } from 'js-waku';
import { Message } from '.';
import asyncify from 'callback-to-async-iterator';
import { PrivateKeyBundle } from './crypto';
import { buildContentTopic } from './utils';

export default class Stream {
  iterator: AsyncIterableIterator<Message>;

  constructor(waku: Waku, recipient: PrivateKeyBundle) {
    if (!recipient.identityKey) {
      throw new Error('invalid recipient key');
    }

    // TODO(snormore): The identity key Ethereum address is not the right
    // topic. It needs to be deterministic from the recipients actual
    // address.
    // TODO:(snormore): The user can stream their requests/introduction topic,
    // or a conversation topic, so that needs to be supported here.
    const contentTopic = buildContentTopic(
      recipient.identityKey.publicKey.getEthereumAddress()
    );

    this.iterator = asyncify<Message>(
      async callback => {
        waku.relay.addObserver(
          async (wakuMsg: WakuMessage) => {
            if (wakuMsg.payload) {
              const msg = await Message.decode(recipient, wakuMsg.payload);
              callback(msg);
            }
          },
          [contentTopic]
        );
      },
      {
        onClose: () => waku.relay.deleteObserver(() => ({}), [contentTopic])
      }
    );
  }

  async next(): Promise<Message> {
    return (await this.iterator.next()).value;
  }
}
