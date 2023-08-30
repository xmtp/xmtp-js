import { InMemoryPersistence } from '../../../src'
import { KeystoreProviderOptions } from '../../../src/keystore/providers'

export const testProviderOptions = ({
  privateKeyOverride = undefined,
  persistConversations = false,
  basePersistence = InMemoryPersistence.create(),
  env = 'local' as const,
}: Partial<KeystoreProviderOptions>) => ({
  env,
  persistConversations,
  privateKeyOverride,
  basePersistence,
  disablePersistenceEncryption: false,
})
