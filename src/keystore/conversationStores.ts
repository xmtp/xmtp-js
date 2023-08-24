import Long from 'long'
import { keystore, invitation } from '@xmtp/proto'
import { Persistence } from './persistence/interface'
import { Mutex } from 'async-mutex'
import { isCompleteTopicData, topicDataToMap, typeSafeTopicMap } from './utils'

export type AddRequest = {
  topic: string
  createdNs: Long
  peerAddress: string
  invitation: invitation.InvitationV1 | undefined
}

const INVITE_STORAGE_KEY = 'invitations/v1'
const V1_STORAGE_KEY = 'conversation-v1/v1'

/**
 * V2Store holds a simple map of topic -> TopicData and writes to the persistence layer on changes
 */
export class V2Store {
  private readonly persistence: Persistence
  private readonly persistenceKey: string
  private readonly mutex: Mutex
  private readonly topicMap: Map<string, keystore.TopicMap_TopicData>

  constructor(
    persistence: Persistence,
    persistenceKey: string,
    initialData: Map<string, keystore.TopicMap_TopicData> = new Map()
  ) {
    this.persistenceKey = persistenceKey
    this.persistence = persistence
    this.mutex = new Mutex()
    this.topicMap = initialData
  }

  static async create(persistence: Persistence): Promise<V2Store> {
    const persistenceKey = INVITE_STORAGE_KEY
    const rawData = await persistence.getItem(persistenceKey)
    if (rawData) {
      try {
        const inviteMap = typeSafeTopicMap(keystore.TopicMap.decode(rawData))
        // Create an InviteStore with data preloaded
        return new V2Store(persistence, persistenceKey, inviteMap)
      } catch (e) {
        console.warn(`Error loading invites from store: ${e}`)
      }
    }
    return new V2Store(persistence, persistenceKey)
  }

  protected validate(topicData: AddRequest): boolean {
    return (
      !!topicData.topic &&
      topicData.topic.length > 0 &&
      isCompleteTopicData(topicData)
    )
  }

  async add(topicData: AddRequest[]): Promise<void> {
    await this.mutex.runExclusive(async () => {
      let isDirty = false
      for (const row of topicData) {
        if (!this.validate(row)) {
          console.warn('Invalid topic data', row)
          continue
        }
        const { topic, ...data } = row
        // This will not overwrite any existing values. First invite found in the store for a given topic will always be used
        // Duplicates do not throw errors
        if (!this.topicMap.has(topic)) {
          this.topicMap.set(topic, data)
          isDirty = true
        }
      }
      // Only write to persistence once, and only if we have added new invites
      if (isDirty) {
        await this.persistence.setItem(this.persistenceKey, this.toBytes())
      }
    })
  }

  get topics(): keystore.TopicMap_TopicData[] {
    return [...this.topicMap.values()]
  }

  lookup(topic: string): keystore.TopicMap_TopicData | undefined {
    return this.topicMap.get(topic)
  }

  private toBytes(): Uint8Array {
    return keystore.TopicMap.encode({
      topics: Object.fromEntries(this.topicMap),
    }).finish()
  }
}

export class V1Store extends V2Store {
  static async create(persistence: Persistence): Promise<V1Store> {
    const persistenceKey = V1_STORAGE_KEY
    const rawData = await persistence.getItem(persistenceKey)
    if (rawData) {
      try {
        const inviteMap = topicDataToMap(keystore.TopicMap.decode(rawData))
        // Create an InviteStore with data preloaded
        return new V1Store(persistence, persistenceKey, inviteMap)
      } catch (e) {
        console.warn(`Error loading invites from store: ${e}`)
      }
    }
    return new V1Store(persistence, persistenceKey)
  }

  protected override validate(topicData: AddRequest) {
    return !!(
      topicData.topic &&
      topicData.topic.length &&
      topicData.peerAddress?.length > 0
    )
  }
}
