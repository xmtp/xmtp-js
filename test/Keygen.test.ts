import { newWallet, LOCAL_DOCKER_MULTIADDR } from './helpers'
import Client, {
  ClientOptions,
  createWaku,
  defaultOptions,
  KeyStoreType,
} from '../src/Client'
import { Signer } from 'ethers'
import { EncryptedStore, PrivateTopicStore } from '../src/store'
import { PrivateKeyBundle } from '../src'

describe('Key Generation', () => {
  let wallet: Signer
  beforeEach(async () => {
    wallet = newWallet()
  })

  test('Network store', async () => {
    const opts = {
      bootstrapAddrs: [LOCAL_DOCKER_MULTIADDR],
    }
    const keys = await Client.getKeys(wallet, opts)
    const client = await Client.create(wallet, {
      ...opts,
      privateKeyOverride: keys,
    })
    expect(client.keys).toEqual(keys)
  })

  test('LocalStorage store', async () => {
    const opts: Partial<ClientOptions> = {
      bootstrapAddrs: [LOCAL_DOCKER_MULTIADDR],
      keyStoreType: KeyStoreType.localStorage,
    }
    const keys = await Client.getKeys(wallet, opts)
    const client = await Client.create(wallet, {
      ...opts,
      privateKeyOverride: keys,
    })
    expect(client.keys).toEqual(keys)
  })

  // Make sure that the keys are being saved to the network upon generation
  test('Ensure persistence', async () => {
    const opts = defaultOptions({
      bootstrapAddrs: [LOCAL_DOCKER_MULTIADDR],
    })
    const keys = await Client.getKeys(wallet, opts)
    const bundle = PrivateKeyBundle.decode(keys)
    const waku = await createWaku(opts)
    const store = new EncryptedStore(wallet, new PrivateTopicStore(waku))

    expect((await store.loadPrivateKeyBundle())?.identityKey).toEqual(
      bundle.identityKey
    )
  })
})
