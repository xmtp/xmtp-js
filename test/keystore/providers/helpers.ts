import { LocalStoragePersistence } from '../../../src'
import { KeystoreProviderOptions } from '../../../src/keystore/providers'

export const testProviderOptions = ({
  privateKeyOverride = undefined,
  persistConversations = false,
  basePersistence = new LocalStoragePersistence(),
  env = 'local' as const,
}: Partial<KeystoreProviderOptions>) => ({
  env,
  persistConversations,
  privateKeyOverride,
  basePersistence,
  disablePersistenceEncryption: false,
})
