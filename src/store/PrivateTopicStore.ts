import { messageApi, fetcher } from '@xmtp/proto'
import { Store } from './Store'
import { buildUserPrivateStoreTopic } from '../utils/topic'
import ApiClient from '../ApiClient'
import { Authenticator } from '../authn'
const b64Decode = fetcher.b64Decode

export default class NetworkStore implements Store {
  client: ApiClient
  constructor(client: ApiClient) {
    this.client = client
  }

  // Returns the first record in a topic if it is present.
  async get(key: string): Promise<Buffer | null> {
    for await (const env of this.client.queryIterator(
      { contentTopics: [this.buildTopic(key)] },
      {
        pageSize: 10,
        direction: messageApi.SortDirection.SORT_DIRECTION_DESCENDING,
      }
    )) {
      if (!env.message) continue
      try {
        const bytes = b64Decode(env.message.toString())
        return Buffer.from(bytes)
      } catch (e) {
        console.log(e)
      }
    }

    return null
  }

  async set(key: string, value: Buffer): Promise<void> {
    const keys = Uint8Array.from(value)
    await this.client.publish([
      {
        contentTopic: this.buildTopic(key),
        message: keys,
      },
    ])
  }

  setAuthenticator(authenticator: Authenticator): void {
    this.client.setAuthenticator(authenticator)
  }

  private buildTopic(key: string): string {
    return buildUserPrivateStoreTopic(key)
  }
}
