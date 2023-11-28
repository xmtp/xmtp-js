import { decodePrivateKeyBundle } from './../src/crypto/PrivateKeyBundle'
import { ApiUrls } from './../src/ApiClient'
import { newWallet, sleep } from './helpers'
import Client, { defaultOptions } from '../src/Client'
import { Signer } from '../src/types/Signer'
import ApiClient from '../src/ApiClient'
import { PublicKeyBundle } from '../src/crypto/PublicKeyBundle'
import { KeyGeneratorKeystoreProvider } from '../src/keystore/providers'
import NetworkKeyManager from '../src/keystore/providers/NetworkKeyManager'
import TopicPersistence from '../src/keystore/persistence/TopicPersistence'

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
    expect(
      (
        decodePrivateKeyBundle(keys).getPublicKeyBundle() as PublicKeyBundle
      ).equals(client.publicKeyBundle)
    ).toBeTruthy()
  })

  // Make sure that the keys are being saved to the network upon generation
  test('Ensure persistence', async () => {
    const opts = defaultOptions({
      env: 'local' as keyof typeof ApiUrls,
    })
    const keys = await Client.getKeys(wallet, opts)
    const manager = new NetworkKeyManager(
      wallet,
      new TopicPersistence(new ApiClient(ApiUrls['local']))
    )

    expect(
      (await manager.loadPrivateKeyBundle())
        ?.getPublicKeyBundle()
        .equals(
          decodePrivateKeyBundle(keys).getPublicKeyBundle() as PublicKeyBundle
        )
    ).toBeTruthy()
  })
})
