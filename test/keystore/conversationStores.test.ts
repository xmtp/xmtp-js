import crypto from '../../src/crypto/crypto'
import { V2Store, TopicData } from '../../src/keystore'
import { AddRequest, V1Store } from '../../src/keystore/conversationStores'
import { InMemoryPersistence } from '../../src/keystore/persistence'
import { dateToNs } from '../../src/utils'

const INVITE_KEY = 'invitations/v1'

const buildAddRequest = (): AddRequest => {
  const topic = crypto.getRandomValues(new Uint8Array(32)).toString()
  return {
    topic,
    createdNs: dateToNs(new Date()).toUnsigned(),
    peerAddress: crypto.getRandomValues(new Uint8Array(42)).toString(),
    invitation: {
      topic,
      aes256GcmHkdfSha256: {
        keyMaterial: crypto.getRandomValues(new Uint8Array(32)),
      },
      context: {
        conversationId: 'foo',
        metadata: {},
      },
    },
  }
}

describe('V2Store', () => {
  it('can add and retrieve invites without persistence', async () => {
    const store = await V2Store.create(InMemoryPersistence.create())
    const addRequest = buildAddRequest()
    await store.add([addRequest])

    const result = store.lookup(addRequest.topic)
    expect(result).not.toBeNull()
    const { topic, ...topicData } = addRequest
    expect(result).toEqual(topicData)
  })

  it('can add and retrieve invites with persistence', async () => {
    const store = await V2Store.create(InMemoryPersistence.create())
    const topicData = buildAddRequest()
    await store.add([topicData])

    const result = store.lookup(topicData.topic)
    expect(result?.invitation).toEqual(topicData.invitation)
    expect(result?.peerAddress).toEqual(topicData.peerAddress)
    expect(result?.createdNs.eq(topicData.createdNs)).toBeTruthy()
  })

  it('returns undefined when no match exists', async () => {
    const store = await V2Store.create(InMemoryPersistence.create())
    const result = store.lookup('foo')
    expect(result).toBeUndefined()
  })

  it('persists data between instances', async () => {
    const persistence = InMemoryPersistence.create()
    const store = await V2Store.create(persistence)
    const topicData = buildAddRequest()
    await store.add([topicData])

    const result = store.lookup(topicData.topic)
    expect(result?.invitation).toEqual(topicData.invitation)
    expect(result?.createdNs.eq(topicData.createdNs)).toBeTruthy()
    expect(result?.peerAddress).toEqual(topicData.peerAddress)

    const store2 = await V2Store.create(persistence)
    const result2 = store2.lookup(topicData.topic)
    expect(result2).toEqual(result)
  })
})

describe('v1Store', () => {
  const buildV1 = (): AddRequest => {
    const peerAddress = crypto.getRandomValues(new Uint8Array(32)).toString()
    return {
      peerAddress,
      createdNs: dateToNs(new Date()).toUnsigned(),
      invitation: undefined,
      topic: `xmtp/${peerAddress}}`,
    }
  }

  it('can add and retrieve v1 convos', async () => {
    const store = await V1Store.create(InMemoryPersistence.create())
    const addReq = buildV1()
    await store.add([addReq])

    const value = store.lookup(addReq.topic)
    expect(value).toBeTruthy()
  })

  it('can round trip to persistence', async () => {
    const persistence = InMemoryPersistence.create()
    const store = await V1Store.create(persistence)
    const requests = [buildV1(), buildV1()]
    await store.add(requests)
    const valuesFromFirstStore = store.topics
    expect(valuesFromFirstStore).toHaveLength(2)

    const store2 = await V1Store.create(persistence)
    const valuesFromSecondStore = store2.topics
    expect(valuesFromFirstStore).toEqual(valuesFromSecondStore)
  })
})
