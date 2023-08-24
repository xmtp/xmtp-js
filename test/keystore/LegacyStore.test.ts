import Long from 'long'
import { InMemoryPersistence, dateToNs } from '../../src'
import LegacyStore from '../../src/keystore/LegacyStore'
import { getRandomValues } from 'crypto'

const buildConvoReference = ({
  peerAddress,
  createdNs,
}: {
  peerAddress?: string
  createdNs?: Long
}) => ({
  peerAddress:
    peerAddress ||
    Buffer.from(getRandomValues(new Uint8Array(32))).toString('hex'),
  createdNs: dateToNs(new Date()).toUnsigned(),
  invitation: undefined,
})

describe('LegacyStore', () => {
  it('round trips', async () => {
    const convo = buildConvoReference({})
    const store = await LegacyStore.create(InMemoryPersistence.create())
    await store.add([convo])
    expect(store.entries).toEqual([convo])
  })

  it('persists correctly', async () => {
    const convos = [buildConvoReference({}), buildConvoReference({})]
    const persistence = InMemoryPersistence.create()
    const store = await LegacyStore.create(persistence)
    await store.add(convos)
    expect(store.entries).toEqual(convos)

    const store2 = await LegacyStore.create(persistence)
    console.log(store.entries, store2.entries)
    expect(store2.entries).toEqual(store.entries)

    expect(await persistence.getItem('legacy-convos/v1')).toBeDefined()
  })
})
