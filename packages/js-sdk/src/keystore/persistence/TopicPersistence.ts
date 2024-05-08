import { messageApi } from '@xmtp/proto'
import type { ApiClient } from '@/ApiClient'
import type { Authenticator } from '@/authn/interfaces'
import { buildUserPrivateStoreTopic } from '@/utils/topic'
import type { Persistence } from './interface'

export default class TopicPersistence implements Persistence {
  apiClient: ApiClient
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  // Returns the first record in a topic if it is present.
  async getItem(key: string): Promise<Uint8Array | null> {
    for await (const env of this.apiClient.queryIterator(
      { contentTopic: this.buildTopic(key) },
      {
        pageSize: 1,
        direction: messageApi.SortDirection.SORT_DIRECTION_DESCENDING,
      }
    )) {
      if (!env.message) continue
      try {
        return Uint8Array.from(env.message)
      } catch (e) {
        console.log(e)
      }
    }

    return null
  }

  async setItem(key: string, value: Uint8Array): Promise<void> {
    const keys = Uint8Array.from(value)
    await this.apiClient.publish([
      {
        contentTopic: this.buildTopic(key),
        message: keys,
      },
    ])
  }

  setAuthenticator(authenticator: Authenticator): void {
    this.apiClient.setAuthenticator(authenticator)
  }

  private buildTopic(key: string): string {
    return buildUserPrivateStoreTopic(key)
  }
}
