import type { XmtpEnv, PreEventCallbackOptions } from '../../Client'
import type { Signer } from '../../types/Signer'
import type { Keystore } from '../interfaces'
import type { ApiClient } from '../../ApiClient'
import { Persistence } from '../persistence'

export type KeystoreProviderOptions = {
  env: XmtpEnv
  persistConversations: boolean
  privateKeyOverride?: Uint8Array
  basePersistence: Persistence
  disablePersistenceEncryption: boolean
} & PreEventCallbackOptions

/**
 * A Keystore Provider is responsible for either creating a Keystore instance or throwing a KeystoreUnavailableError
 * It is typically used once on application startup to bootstrap the Keystore and load/decrypt the user's private keys
 */
export interface KeystoreProvider {
  newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ): Promise<Keystore>
}
