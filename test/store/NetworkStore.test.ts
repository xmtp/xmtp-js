import { Wallet } from 'ethers'

import { newWallet, sleep } from '../helpers'
import { PrivateTopicStore } from '../../src/store'
import ApiClient, { ApiUrls } from '../../src/ApiClient'
import { PrivateKeyBundleV1 } from '../../src/crypto'
import Authenticator from '../../src/authn/Authenticator'

type TestCase = { name: string; api: string }

describe('PrivateTopicStore', () => {
  const tests: TestCase[] = [
    {
      name: 'local docker node',
      api: ApiUrls.local,
    },
  ]
  if (process.env.CI || process.env.TESTNET) {
    tests.push({
      name: 'dev',
      api: ApiUrls.dev,
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
        store = new PrivateTopicStore(new ApiClient(testCase.api))
        const keys = await PrivateKeyBundleV1.generate(wallet)
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
<<<<<<< HEAD
=======

      it('distinct topics', async () => {
        const valueA = Buffer.from(new TextEncoder().encode('helloA'))
        const valueB = Buffer.from(new TextEncoder().encode('helloB'))
        const keyA = wallet.address + 'A'
        const keyB = wallet.address + 'B'

        store.set(keyA, valueA)
        store.set(keyB, valueB)
        await sleep(100)
        const responseA = await store.get(keyA)
        const responseB = await store.get(keyB)

        expect(responseA).toEqual(valueA)
        expect(responseB).toEqual(valueB)
        expect(responseA).not.toEqual(responseB)
      })
>>>>>>> 4702259 (fix: test hitting the wrong network)
    })
  })
})
