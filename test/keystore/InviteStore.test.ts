import crypto from '../../src/crypto/crypto'
import { InviteStore, TopicData } from '../../src/keystore'
import { LocalStoragePersistence } from '../../src/keystore/persistence'
import { dateToNs } from '../../src/utils'

const buildTopicData = (): TopicData => ({
  createdNs: dateToNs(new Date()).toUnsigned(),
  peerAddress: crypto.getRandomValues(new Uint8Array(42)).toString(),
  invitation: {
    topic: crypto.getRandomValues(new Uint8Array(32)).toString(),
    aes256GcmHkdfSha256: {
      keyMaterial: crypto.getRandomValues(new Uint8Array(32)),
    },
    context: {
      conversationId: 'foo',
      metadata: {},
    },
  },
})

describe('InviteStore', () => {
  it('can add and retrieve invites without persistence', async () => {
    const store = await InviteStore.create()
    const topicData = buildTopicData()
    await store.add([topicData])

    const result = store.lookup(topicData.invitation.topic)
    expect(result).not.toBeNull()
    expect(result).toEqual(topicData)
  })

  it('can add and retrieve invites with persistence', async () => {
    const store = await InviteStore.create(new LocalStoragePersistence())
    const topicData = buildTopicData()
    await store.add([topicData])

    const result = store.lookup(topicData.invitation.topic)
    expect(result).toEqual(topicData)
  })

  it('returns undefined when no match exists', async () => {
    const store = await InviteStore.create()
    const result = store.lookup('foo')
    expect(result).toBeUndefined()
  })

  it('persists data between instances', async () => {
    const persistence = new LocalStoragePersistence()
    const store = await InviteStore.create(persistence)
    const topicData = buildTopicData()
    await store.add([topicData])

    const result = store.lookup(topicData.invitation.topic)
    expect(result).toEqual(topicData)

    const store2 = await InviteStore.create(persistence)
    const result2 = store2.lookup(topicData.invitation.topic)
    expect(result2).toEqual(topicData)
  })
})
