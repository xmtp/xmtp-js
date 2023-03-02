import { keystore } from '@xmtp/proto'
import { Persistence } from './persistence/interface'
import type { TopicData } from './interfaces'
import { Mutex } from 'async-mutex'
import { typeSafeTopicMap } from './utils'

const INVITE_KEY = 'invitations:v1'

/**
 * InviteStore holds a simple map of topic -> TopicData and writes to the persistence layer on changes
 */
export default class InviteStore {
  private persistence?: Persistence
  private mutex: Mutex
  private topicMap: Map<string, TopicData>

  constructor(
    persistence?: Persistence,
    initialData: Map<string, TopicData> = new Map()
  ) {
    this.persistence = persistence
    this.mutex = new Mutex()
    this.topicMap = initialData
  }

  static async create(persistence?: Persistence): Promise<InviteStore> {
    if (persistence) {
      const rawData = await persistence.getItem(INVITE_KEY)
      if (rawData) {
        try {
          const inviteMap = typeSafeTopicMap(keystore.TopicMap.decode(rawData))
          // Create an InviteStore with data preloaded
          return new InviteStore(
            persistence,
            new Map(Object.entries(inviteMap))
          )
        } catch (e) {
          console.warn(`Error loading invites from store: ${e}`)
        }
      }
    }
    return new InviteStore(persistence)
  }

  async add(topicData: TopicData[]): Promise<void> {
    await this.mutex.runExclusive(async () => {
      let isDirty = false
      for (const row of topicData) {
        // This will not overwrite any existing values. First invite found in the store for a given topic will always be used
        // Duplicates do not throw errors
        if (!this.topicMap.has(row.invitation.topic)) {
          this.topicMap.set(row.invitation.topic, row)
          isDirty = true
        }
      }
      // Only write to persistence once, and only if we have added new invites
      if (isDirty && this.persistence) {
        await this.persistence.setItem(INVITE_KEY, this.toBytes())
      }
    })
  }

  get topics(): TopicData[] {
    return [...this.topicMap.values()]
  }

  lookup(topic: string): TopicData | undefined {
    return this.topicMap.get(topic)
  }

  private toBytes(): Uint8Array {
    return keystore.TopicMap.encode({
      topics: Object.fromEntries(this.topicMap),
    }).finish()
  }
}
