import { ApiUrls } from './../src/Client'
import { newWallet } from './helpers'
import Client, {
  ClientOptions,
  defaultOptions,
  KeyStoreType,
} from '../src/Client'
import { Signer } from 'ethers'
import { EncryptedStore, PrivateTopicStore } from '../src/store'
import { PrivateKeyBundle } from '../src'
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
    expect(client.keys.encode()).toEqual(keys)
  })

  test('LocalStorage store', async () => {
    const opts: Partial<ClientOptions> = {
      env: 'local' as keyof typeof ApiUrls,
    }
    const keys = await Client.getKeys(wallet, {
      ...opts,
      keyStoreType: KeyStoreType.localStorage,
    })
    const client = await Client.create(null, {
      ...opts,
      privateKeyOverride: keys,
    })
    expect(client.keys.encode()).toEqual(keys)
  })

  // Make sure that the keys are being saved to the network upon generation
  test('Ensure persistence', async () => {
    const opts = defaultOptions({
      env: 'local' as keyof typeof ApiUrls,
    })
    const keys = await Client.getKeys(wallet, opts)
    const bundle = PrivateKeyBundle.decode(keys)
    const apiClient = new ApiClient(ApiUrls[opts.env])
    const store = new EncryptedStore(wallet, new PrivateTopicStore(apiClient))

    expect((await store.loadPrivateKeyBundle())?.identityKey.toBytes()).toEqual(
      bundle.identityKey.toBytes()
    )
  })
})
