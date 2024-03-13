import { keystore, type invitation } from '@xmtp/proto'
import { Mutex } from 'async-mutex'
import type Long from 'long'
import { numberToUint8Array, uint8ArrayToNumber } from '@/utils/bytes'
import type { Persistence } from './persistence/interface'
import { isCompleteTopicData, topicDataToMap } from './utils'

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
  private revision: number

  constructor(
    persistence: Persistence,
    persistenceKey: string,
    initialData: Map<string, keystore.TopicMap_TopicData> = new Map()
  ) {
    this.persistenceKey = persistenceKey
    this.persistence = persistence
    this.revision = 0
    this.mutex = new Mutex()
    this.topicMap = initialData
  }

  get revisionKey(): string {
    return this.persistenceKey + '/revision'
  }

  static async create(persistence: Persistence): Promise<V2Store> {
    const persistenceKey = INVITE_STORAGE_KEY

    const v2Store = new V2Store(persistence, persistenceKey)
    await v2Store.refresh()
    return v2Store
  }

  protected validate(topicData: AddRequest): boolean {
    return (
      !!topicData.topic &&
      topicData.topic.length > 0 &&
      isCompleteTopicData(topicData)
    )
  }

  async refresh() {
    const currentRevision = await this.getRevision()
    if (currentRevision > this.revision) {
      for (const [topic, data] of await this.loadFromPersistence()) {
        this.topicMap.set(topic, data)
      }
    }
    this.revision = currentRevision
  }

  async getRevision(): Promise<number> {
    const data = await this.persistence.getItem(this.revisionKey)
    if (!data) {
      return 0
    }
    return uint8ArrayToNumber(data)
  }

  async setRevision(number: number) {
    await this.persistence.setItem(this.revisionKey, numberToUint8Array(number))
  }

  async loadFromPersistence(): Promise<
    Map<string, keystore.TopicMap_TopicData>
  > {
    const rawData = await this.persistence.getItem(this.persistenceKey)
    if (!rawData) {
      return new Map()
    }
    return topicDataToMap(keystore.TopicMap.decode(rawData))
  }

  async store() {
    await this.persistence.setItem(this.persistenceKey, this.toBytes())
    this.revision++
    await this.setRevision(this.revision)
  }

  async add(topicData: AddRequest[]): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.refresh()
      let isDirty = false
      for (const row of topicData) {
        if (!this.validate(row)) {
          console.warn('Invalid topic data', row.topic)
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
        await this.store()
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
    const v1Store = new V1Store(persistence, persistenceKey)
    await v1Store.refresh()

    return v1Store
  }

  protected override validate(topicData: AddRequest) {
    return !!(
      topicData.topic &&
      topicData.topic.length &&
      topicData.peerAddress?.length > 0
    )
  }
}
