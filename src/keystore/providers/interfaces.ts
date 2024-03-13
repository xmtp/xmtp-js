import type { ApiClient } from '@/ApiClient'
import type { PreEventCallbackOptions, XmtpEnv } from '@/Client'
import type { Persistence } from '@/keystore/persistence/interface'
import type {
  KeystoreInterface,
  KeystoreInterfaces,
} from '@/keystore/rpcDefinitions'
import type { Signer } from '@/types/Signer'

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
export interface KeystoreProvider<
  T extends KeystoreInterfaces = KeystoreInterface,
> {
  newKeystore(
    opts: KeystoreProviderOptions,
    apiClient: ApiClient,
    wallet?: Signer
  ): Promise<T>
}
