import { NetworkStore } from '../../src/store'

describe('NetworkStore', () => {
  jest.setTimeout(10000)
  const tests = [
    {
      name: 'local docker node',
      newWaku: undefined,
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'testnet',
      newWaku: undefined,
    })
  }
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let store: NetworkStore

      beforeEach(async () => {
        store = new NetworkStore()
      })

      it('roundtrip', async () => {
        const key = 'key'

        const value = new TextEncoder().encode('hello')
        const empty = await store.get(key)
        expect(empty).toBeNull()

        await store.set(key, Buffer.from(value))
        const full = await store.get(key)

        expect(full).toBeDefined()
        expect(full).toEqual(Buffer.from(value))
      })

      it('distinct topics', async () => {
        const valueA = Buffer.from(new TextEncoder().encode('helloA'))
        const valueB = Buffer.from(new TextEncoder().encode('helloB'))
        const keyA = 'keyA'
        const keyB = 'keyB'

        store.set(keyA, valueA)
        store.set(keyB, valueB)
        const responseA = await store.get(keyA)
        const responseB = await store.get(keyB)

        expect(responseA).toEqual(valueA)
        expect(responseB).toEqual(valueB)
        expect(responseA).not.toEqual(responseB)
      })

      it('over write safety', async () => {
        const key = 'key'

        const first_value = new TextEncoder().encode('a')
        const second_value = new TextEncoder().encode('bb')

        await store.set(key, Buffer.from(first_value))
        await store.set(key, Buffer.from(second_value))
        const returned_value = await store.get(key)

        expect(returned_value).toEqual(Buffer.from(first_value))
      })
    })
  })
})
