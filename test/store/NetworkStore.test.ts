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
    })
  })
})
