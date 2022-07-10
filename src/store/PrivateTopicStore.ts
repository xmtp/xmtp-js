// This creates an interface for storing data to the storage network.
import { Store } from './Store'
import { Waku, WakuMessage, PageDirection } from 'js-waku'
import { buildUserPrivateStoreTopic } from '../utils'
import {
  Envelope,
  Message as MessageService,
  QueryRequestSortDirection,
} from '../proto/message.pb'
import { b64Decode } from '../proto/fetch.pb'

export default class NetworkStore implements Store {
  // constructor() {
  //   // TODO: xmtpd client
  // }

  // Returns the first record in a topic if it is present.
  async get(key: string): Promise<Buffer | null> {
    const res = await MessageService.Query(
      {
        contentTopic: this.buildTopic(key),
        limit: 1,
        sortDirection: QueryRequestSortDirection.SORT_DIRECTION_ASCENDING,
      },
      {
        pathPrefix: 'https://localhost:5000',
      }
    )

    const contents: Uint8Array[] = []
    for (const env of res.envelopes || []) {
      if (!env.message) continue
      try {
        const bytes = b64Decode(env.message.toString())
        contents.push(bytes)
      } catch (e) {
        console.log(e)
      }
    }
    return contents.length > 0 ? Buffer.from(contents[0]) : null
  }

  async set(key: string, value: Buffer): Promise<void> {
    const keys = Uint8Array.from(value)
    try {
      await MessageService.Publish(
        {
          contentTopic: this.buildTopic(key),
          message: keys,
        },
        {
          pathPrefix: 'https://localhost:5000',
        }
      )
    } catch (err) {
      console.log(err)
    }
  }

  private buildTopic(key: string): string {
    return buildUserPrivateStoreTopic(key)
  }
}
