import { Wallet } from 'ethers'
import { Waku } from 'js-waku'

import { newWallet, sleep } from '../helpers'
import { createWaku, defaultOptions } from '../../src/Client'
import { PrivateTopicStore } from '../../src/store'

const newLocalDockerWaku = (): Promise<Waku> =>
  createWaku(
    defaultOptions({
      bootstrapAddrs: [
        '/ip4/127.0.0.1/tcp/9001/ws/p2p/16Uiu2HAmNCxLZCkXNbpVPBpSSnHj9iq4HZQj7fxRzw2kj1kKSHHA',
      ],
    })
  )

const newTestnetWaku = (): Promise<Waku> =>
  createWaku(defaultOptions({ env: 'dev' }))

describe('PrivateTopicStore', () => {
  const tests = [
    {
      name: 'local docker node',
      newWaku: newLocalDockerWaku,
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'dev',
      newWaku: newTestnetWaku,
    })
  }
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let waku: Waku
      let wallet: Wallet
      let store: PrivateTopicStore
      beforeAll(async () => {
        waku = await testCase.newWaku()
      })
      afterAll(async () => {
        if (waku) await waku.stop()
      })

      beforeEach(async () => {
        wallet = newWallet()
        store = new PrivateTopicStore(waku)
      })

      it('roundtrip', async () => {
        const key = wallet.address

        const value = new TextEncoder().encode('hello')
        const empty = await store.get(key)
        expect(empty).toBeNull()

        await store.set(key, Buffer.from(value))
        await sleep(100)
        const full = await store.get(key)

        expect(full).toBeDefined()
        expect(full).toEqual(Buffer.from(value))
      })

      it('distinct topics', async () => {
        const valueA = Buffer.from(new TextEncoder().encode('helloA'))
        const valueB = Buffer.from(new TextEncoder().encode('helloB'))
        const keyA = wallet.address + 'A'
        const keyB = wallet.address + 'B'

        store.set(keyA, valueA)
        store.set(keyB, valueB)
        await sleep(50)
        const responseA = await store.get(keyA)
        const responseB = await store.get(keyB)

        expect(responseA).toEqual(valueA)
        expect(responseB).toEqual(valueB)
        expect(responseA).not.toEqual(responseB)
      })
    })
  })
})
