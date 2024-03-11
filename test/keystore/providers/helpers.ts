import { InMemoryPersistence } from '../../../src'
import type { KeystoreProviderOptions } from '../../../src/keystore/providers'

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
