import { ApiUrls } from './../src/ApiClient'
import { newWallet, sleep } from './helpers'
import Client, { defaultOptions } from '../src/Client'
import { Signer } from '../src/types/Signer'
import {
  EncryptedKeyStore,
  PrivateTopicStore,
  StaticKeyStore,
} from '../src/store'
import ApiClient from '../src/ApiClient'

describe('Key Generation', () => {
  let wallet: Signer
  beforeEach(async () => {
    wallet = newWallet()
  })

  test('Network store', async () => {
    const opts = {
      env: 'local' as keyof typeof ApiUrls,
    }
    const keys = await Client.getKeys(wallet, opts)
    const client = await Client.create(null, {
      ...opts,
      privateKeyOverride: keys,
    })
    expect(client.legacyKeys.encode()).toEqual(keys)
  })

  // Make sure that the keys are being saved to the network upon generation
  test('Ensure persistence', async () => {
    const opts = defaultOptions({
      env: 'local' as keyof typeof ApiUrls,
    })
    const keys = await Client.getKeys(wallet, opts)
    const staticStore = new StaticKeyStore(keys)
    const bundle = await staticStore.loadPrivateKeyBundle()
    const apiClient = new ApiClient(ApiUrls[opts.env])
    const store = new EncryptedKeyStore(
      wallet,
      new PrivateTopicStore(apiClient)
    )
    await sleep(500)

    expect((await store.loadPrivateKeyBundle())?.identityKey.toBytes()).toEqual(
      bundle.identityKey.toBytes()
    )
  })
})
