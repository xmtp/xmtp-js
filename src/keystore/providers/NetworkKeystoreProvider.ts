import type { ApiClient } from '@/ApiClient'
import InMemoryKeystore from '@/keystore/InMemoryKeystore'
import TopicPersistence from '@/keystore/persistence/TopicPersistence'
import type { KeystoreInterface } from '@/keystore/rpcDefinitions'
import type { Signer } from '@/types/Signer'
import { KeystoreProviderUnavailableError } from './errors'
import { buildPersistenceFromOptions } from './helpers'
import type { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import NetworkKeyLoader from './NetworkKeyManager'

/**
 * NetworkKeystoreProvider will look on the XMTP network for an `EncryptedPrivateKeyBundle`
 * on the user's private storage topic. If found, will decrypt the bundle using a wallet
 * signature and instantiate a Keystore instance using the decrypted value.
 */
export default class NetworkKeystoreProvider implements KeystoreProvider {
  async newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ): Promise<KeystoreInterface> {
    if (!wallet) {
      throw new KeystoreProviderUnavailableError('No wallet provided')
    }

    const loader = new NetworkKeyLoader(
      wallet,
      new TopicPersistence(apiClient),
      opts.preEnableIdentityCallback
    )
    const keys = await loader.loadPrivateKeyBundle()
    if (!keys) {
      throw new KeystoreProviderUnavailableError('No keys found')
    }

    return InMemoryKeystore.create(
      keys,
      await buildPersistenceFromOptions(opts, keys)
    )
  }
}
