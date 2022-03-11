// This creates an interface for storing data to the storage network.
import { Store } from './Store'
import { Waku, WakuMessage, PageDirection } from 'js-waku'

export default class NetworkStore implements Store {
  private waku: Waku
  keyGenerator: (str: string) => string

  constructor(waku: Waku, keyGenerator: (str: string) => string) {
    this.waku = waku
    this.keyGenerator = keyGenerator
  }

  // Returns the first record in a topic if it is present.
  async get(key: string): Promise<Buffer | null> {
    const contents = (
      await this.waku.store.queryHistory([this.keyGenerator(key)], {
        pageSize: 1,
        pageDirection: PageDirection.FORWARD,
      })
    )
      .filter((msg: WakuMessage) => msg.payload)
      .map((msg: WakuMessage) => msg.payload as Uint8Array)
    return contents.length > 0 ? Buffer.from(contents[0]) : null
  }

  async set(key: string, value: Buffer): Promise<void> {
    const keys = Uint8Array.from(value)
    await this.waku.relay.send(
      await WakuMessage.fromBytes(keys, this.keyGenerator(key))
    )
  }
}
