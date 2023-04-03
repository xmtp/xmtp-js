import { Signer } from './../../types/Signer'
import ApiClient from '../../ApiClient'
import { KeystoreProvider, KeystoreProviderOptions } from './interfaces'
import NetworkKeyLoader from './NetworkKeyManager'
import { KeystoreProviderUnavailableError } from './errors'
import TopicPersistence from '../persistence/TopicPersistence'
import { Keystore } from '../interfaces'
import InMemoryKeystore from '../InMemoryKeystore'
import { buildPersistenceFromOptions } from './helpers'

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
  ): Promise<Keystore> {
    if (!wallet) {
      throw new KeystoreProviderUnavailableError('No wallet provided')
    }

    const loader = new NetworkKeyLoader(wallet, new TopicPersistence(apiClient))
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
