import { keystore } from '@xmtp/proto'
import { Persistence } from './persistence/interface'
import { Mutex } from 'async-mutex'
import Long from 'long'
import { topicDataToMap } from './utils'

const LEGACY_KEY = 'legacy-convos/v1'

type Entry = {
  peerAddress: string
  createdNs: Long
  invitation: undefined
}

/**
 * InviteStore holds a simple map of topic -> TopicData and writes to the persistence layer on changes
 */
export default class LegacyStore {
  private persistence: Persistence
  private mutex: Mutex
  private topicMap: Map<string, Entry>

  constructor(
    persistence: Persistence,
    initialData: Map<string, Entry> = new Map()
  ) {
    this.persistence = persistence
    this.mutex = new Mutex()
    this.topicMap = initialData
  }

  static async create(persistence: Persistence): Promise<LegacyStore> {
    const rawData = await persistence.getItem(LEGACY_KEY)
    if (rawData) {
      try {
        const topicMap = keystore.TopicMap.decode(rawData)
        // Create an InviteStore with data preloaded
        return new LegacyStore(
          persistence,
          topicDataToMap(topicMap) as Map<string, Entry>
        )
      } catch (e) {
        console.warn(`Error loading invites from store: ${e}`)
      }
    }
    return new LegacyStore(persistence)
  }

  async add(topicData: Entry[]): Promise<void> {
    await this.mutex.runExclusive(async () => {
      let isDirty = false
      for (const row of topicData) {
        // This will not overwrite any existing values. First invite found in the store for a given topic will always be used
        // Duplicates do not throw errors
        if (!this.topicMap.has(row.peerAddress)) {
          this.topicMap.set(row.peerAddress, row)
          isDirty = true
        }
      }
      // Only write to persistence once, and only if we have added new invites
      if (isDirty) {
        await this.persistence.setItem(LEGACY_KEY, this.toBytes())
      }
    })
  }

  get entries(): Entry[] {
    return [...this.topicMap.values()]
  }

  private toBytes(): Uint8Array {
    return keystore.TopicMap.encode({
      topics: Object.fromEntries(this.topicMap),
    }).finish()
  }
}
