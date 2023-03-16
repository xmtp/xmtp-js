import ApiClient from '../../ApiClient'
import { PrivateKeyBundleV1 } from '../../crypto'
import { Signer } from '../../types/Signer'
import InMemoryKeystore from '../InMemoryKeystore'
import { Keystore } from '../interfaces'
import TopicPersistence from '../persistence/TopicPersistence'
import { KeystoreProviderUnavailableError } from './errors'
import { buildPersistenceFromOptions } from './helpers'
import { KeystoreProviderOptions } from './interfaces'
import NetworkKeyManager from './NetworkKeyManager'

export default class KeyGeneratorKeystoreProvider {
  async newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ): Promise<Keystore> {
    if (!wallet) {
      throw new KeystoreProviderUnavailableError(
        'Wallet required to generate new keys'
      )
    }
    console.log(
      'Generating new key bundle for wallet',
      await wallet.getAddress()
    )
    const bundle = await PrivateKeyBundleV1.generate(wallet)
    const manager = new NetworkKeyManager(
      wallet,
      new TopicPersistence(apiClient)
    )
    await manager.storePrivateKeyBundle(bundle)

    return InMemoryKeystore.create(
      bundle,
      opts.persistConversations
        ? await buildPersistenceFromOptions(opts, bundle)
        : undefined
    )
  }
}
