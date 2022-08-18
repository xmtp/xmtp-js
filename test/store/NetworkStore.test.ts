import { Wallet } from 'ethers'

import { newWallet, sleep } from '../helpers'
import { PrivateTopicStore } from '../../src/store'
import ApiClient from '../../src/ApiClient'
import { ApiUrls } from '../../src/Client'
import { PrivateKeyBundle } from '../../src/crypto'
import Authenticator from '../../src/authn/Authenticator'

describe('PrivateTopicStore', () => {
  const tests = [
    {
      name: 'local docker node',
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'dev',
    })
  }
  tests.forEach((testCase) => {
    describe(testCase.name, () => {
      let wallet: Wallet
      let store: PrivateTopicStore
      beforeAll(async () => {})
      afterAll(async () => {})

      beforeEach(async () => {
        wallet = newWallet()
        store = new PrivateTopicStore(new ApiClient(ApiUrls['local']))
        const keys = await PrivateKeyBundle.generate(wallet)
        store.setAuthenticator(new Authenticator(keys.identityKey))
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
